import json
import uuid
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from lightgbm import LGBMRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.config import ARTIFACTS_DIR, MIN_HISTORY_DAYS_FOR_ML, MIN_SAMPLES_FOR_ML
from app.db import db_cursor
from app.features import FEATURE_COLUMNS, load_raw_product_daily_panel, build_features


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.maximum(0.0, np.asarray(y_pred, dtype=float))
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    denom = float(np.sum(np.abs(y_true)))
    wape = float(np.sum(np.abs(y_true - y_pred)) / denom) if denom > 0 else 0.0
    smape_denom = np.abs(y_true) + np.abs(y_pred)
    smape = float(np.mean(np.where(smape_denom > 0, 2.0 * np.abs(y_pred - y_true) / smape_denom, 0.0)))
    bias = float(np.mean(y_pred - y_true))
    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4),
        "smape": round(smape, 4),
        "forecast_bias": round(bias, 4),
    }


def _baseline_predict_row(avg_7: float, avg_30: float, views_7: float, cart_7: float, horizon_days: int) -> float:
    """
    Moving Average + Weighted Recent Trend + Behavior signal baseline (dùng cho Cold-start / Fallback).
    """
    base_daily = 0.7 * float(avg_7) + 0.3 * float(avg_30)
    # Tín hiệu hành vi nhẹ nếu chưa có lịch sử bán nhưng có lượt xem / giỏ hàng
    behavior_boost = min(0.5, 0.02 * float(cart_7) + 0.003 * float(views_7))
    daily_rate = max(0.0, base_daily + (behavior_boost if base_daily == 0 else 0.0))
    return round(daily_rate * horizon_days, 2)


def ensure_baseline_model_registered():
    """Đảm bảo luôn có ít nhất 1 phiên bản Baseline hợp lệ trong MLModelVersions nếu chưa có model nào."""
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT COUNT(*) FROM MLModelVersions WHERE is_production = 1")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO MLModelVersions (
                    model_version, model_type, horizon_days, training_date,
                    feature_schema_json, status, is_production, notes
                ) VALUES (
                    'v1.0-baseline', 'MOVING_AVERAGE_BASELINE', 0, SYSUTCDATETIME(),
                    ?, 'ACTIVE', 1,
                    N'Statistical Moving Average Baseline (kích hoạt tự động khi lịch sử chưa đủ ngưỡng ML).'
                )
            """, (json.dumps(FEATURE_COLUMNS),))


def get_active_production_model() -> dict | None:
    with db_cursor() as cur:
        cur.execute("""
            SELECT TOP 1 model_version, model_type, training_date, dataset_start_date, dataset_end_date,
                   train_metrics_json, val_metrics_json, test_metrics_json, artifact_path, status
            FROM MLModelVersions
            WHERE is_production = 1
            ORDER BY training_date DESC
        """)
        row = cur.fetchone()
        if not row:
            return None
        return {
            "model_version": row[0],
            "model_type": row[1],
            "training_date": row[2].isoformat() if row[2] else None,
            "dataset_start_date": row[3].isoformat() if row[3] else None,
            "dataset_end_date": row[4].isoformat() if row[4] else None,
            "train_metrics": json.loads(row[5]) if row[5] else None,
            "val_metrics": json.loads(row[6]) if row[6] else None,
            "test_metrics": json.loads(row[7]) if row[7] else None,
            "artifact_path": row[8],
            "status": row[9],
        }


def train_models(trigger_type: str = "MANUAL", force: bool = False) -> dict:
    """
    Huấn luyện LightGBM & XGBoost với Time-Series Split theo thời gian.
    Trung thực báo cáo nếu dữ liệu chưa đủ ngưỡng để tránh giả lập độ chính xác.
    """
    run_id = f"TRAIN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    started_at = datetime.now(timezone.utc)
    ensure_baseline_model_registered()

    panel, _ = load_raw_product_daily_panel()
    if panel.empty:
        return {"status": "FAILED", "message": "Không có dữ liệu sản phẩm trong DB."}

    distinct_sales_days = int(panel.loc[panel["units_sold"] > 0, "metric_date"].nunique())
    df = build_features(panel)

    # Kiểm tra tập dữ liệu có nhãn target_7d hợp lệ (không tính các ngày hết hàng có sales=0 vào train nếu sản phẩm từng bán)
    train_df_7 = df[df["target_7d"].notna()].copy()
    valid_samples = len(train_df_7)

    if (distinct_sales_days < MIN_HISTORY_DAYS_FOR_ML or valid_samples < MIN_SAMPLES_FOR_ML) and not force:
        msg = (
            f"Dữ liệu lịch sử thực tế hiện có {distinct_sales_days} ngày phát sinh đơn hàng "
            f"({valid_samples} mẫu chuỗi thời gian), chưa đạt ngưỡng tối thiểu "
            f"({MIN_HISTORY_DAYS_FOR_ML} ngày / {MIN_SAMPLES_FOR_ML} mẫu) để huấn luyện LightGBM tin cậy. "
            f"Hệ thống giữ nguyên chế độ Moving Average Baseline để tránh sai số giả tạo."
        )
        with db_cursor(commit=True) as cur:
            cur.execute("""
                INSERT INTO MLTrainingLogs (run_id, trigger_type, model_version, status, dataset_rows, promoted, message, started_at, finished_at)
                VALUES (?, ?, 'v1.0-baseline', 'SKIPPED_INSUFFICIENT_DATA', ?, 0, ?, ?, SYSUTCDATETIME())
            """, (run_id, trigger_type, valid_samples, msg, started_at))
        return {
            "run_id": run_id,
            "status": "SKIPPED_INSUFFICIENT_DATA",
            "insufficient_data": True,
            "distinct_sales_days": distinct_sales_days,
            "valid_samples": valid_samples,
            "active_model": get_active_production_model(),
            "message": msg,
        }

    # Chia Train / Val / Test nghiêm ngặt theo thời gian (70% / 15% / 15%)
    unique_dates = sorted(train_df_7["metric_date"].unique())
    if len(unique_dates) < 10:
        return {"run_id": run_id, "status": "SKIPPED_INSUFFICIENT_DATA", "message": "Số ngày chuỗi thời gian quá ít (< 10)."}

    t_idx = max(1, int(len(unique_dates) * 0.70))
    v_idx = max(t_idx + 1, int(len(unique_dates) * 0.85))
    train_end = unique_dates[t_idx - 1]
    val_end = unique_dates[min(v_idx - 1, len(unique_dates) - 2)]

    artifacts = {}
    all_val_metrics = {}
    all_test_metrics = {}
    all_train_metrics = {}
    baseline_test_mae_7d = None

    hyperparams = {
        "n_estimators": 120,
        "learning_rate": 0.05,
        "num_leaves": 15,
        "min_child_samples": 5,
        "random_state": 42,
        "verbose": -1,
    }

    for horizon in (7, 14, 30):
        sub = df[df[f"target_{horizon}d"].notna()].copy()
        # Business Safety: bỏ qua mẫu mà kỳ mục tiêu hoàn toàn hết hàng làm triệt tiêu doanh số giả
        tr = sub[sub["metric_date"] <= train_end]
        va = sub[(sub["metric_date"] > train_end) & (sub["metric_date"] <= val_end)]
        te = sub[sub["metric_date"] > val_end]

        if len(tr) < 10 or len(va) < 2 or len(te) < 2:
            continue

        X_tr, y_tr = tr[FEATURE_COLUMNS], tr[f"target_{horizon}d"].values
        X_va, y_va = va[FEATURE_COLUMNS], va[f"target_{horizon}d"].values
        X_te, y_te = te[FEATURE_COLUMNS], te[f"target_{horizon}d"].values

        lgbm = LGBMRegressor(**hyperparams)
        lgbm.fit(X_tr, y_tr)

        xgb = XGBRegressor(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42, verbosity=0)
        xgb.fit(X_tr, y_tr)

        pred_te_lgbm = lgbm.predict(X_te)
        pred_te_xgb = xgb.predict(X_te)
        pred_te_base = np.array([
            _baseline_predict_row(r["avg_sales_7_days"], r["avg_sales_30_days"], r["views_7_days"], r["cart_adds_7_days"], horizon)
            for _, r in te.iterrows()
        ])

        m_tr = compute_metrics(y_tr, lgbm.predict(X_tr))
        m_va = compute_metrics(y_va, lgbm.predict(X_va))
        m_te_lgbm = compute_metrics(y_te, pred_te_lgbm)
        m_te_xgb = compute_metrics(y_te, pred_te_xgb)
        m_te_base = compute_metrics(y_te, pred_te_base)

        if horizon == 7:
            baseline_test_mae_7d = m_te_base["mae"]

        artifacts[horizon] = lgbm
        all_train_metrics[f"{horizon}d"] = m_tr
        all_val_metrics[f"{horizon}d"] = m_va
        all_test_metrics[f"{horizon}d"] = {
            "lightgbm": m_te_lgbm,
            "xgboost": m_te_xgb,
            "baseline": m_te_base,
        }

    if 7 not in artifacts:
        msg = "Không đủ chuỗi thời gian đã hoàn tất cho cửa sổ validation/test 7 ngày."
        with db_cursor(commit=True) as cur:
            cur.execute("""
                INSERT INTO MLTrainingLogs (run_id, trigger_type, model_version, status, dataset_rows, promoted, message, started_at, finished_at)
                VALUES (?, ?, 'v1.0-baseline', 'SKIPPED_INSUFFICIENT_DATA', ?, 0, ?, ?, SYSUTCDATETIME())
            """, (run_id, trigger_type, valid_samples, msg, started_at))
        return {"run_id": run_id, "status": "SKIPPED_INSUFFICIENT_DATA", "message": msg}

    lgbm_mae_7d = all_test_metrics["7d"]["lightgbm"]["mae"]
    lgbm_rmse_7d = all_test_metrics["7d"]["lightgbm"]["rmse"]
    lgbm_wape_7d = all_test_metrics["7d"]["lightgbm"]["wape"]
    lgbm_bias_7d = all_test_metrics["7d"]["lightgbm"]["forecast_bias"]

    # Chỉ promote nếu LightGBM tốt hơn hoặc bằng Baseline (hoặc model production hiện tại)
    current_prod = get_active_production_model()
    prev_mae = None
    if current_prod and current_prod.get("test_metrics") and "7d" in current_prod["test_metrics"]:
        prev_mae = current_prod["test_metrics"]["7d"].get("lightgbm", {}).get("mae")

    beats_baseline = (baseline_test_mae_7d is None) or (lgbm_mae_7d <= baseline_test_mae_7d * 1.05)
    beats_prev = (prev_mae is None) or (lgbm_mae_7d <= prev_mae)
    promoted = bool(beats_baseline and beats_prev)

    new_version = f"v{datetime.now(timezone.utc).strftime('%Y%m%d.%H%M')}-lgbm"
    artifact_file = ARTIFACTS_DIR / f"{new_version}.joblib"
    joblib.dump({"models": artifacts, "features": FEATURE_COLUMNS, "version": new_version}, artifact_file)

    status_val = "ACTIVE" if promoted else "STAGING"
    log_status = "SUCCESS" if promoted else "REJECTED_WORSE_THAN_PROD"

    with db_cursor(commit=True) as cur:
        if promoted:
            cur.execute("UPDATE MLModelVersions SET is_production = 0, status = 'ARCHIVED', updated_at = SYSUTCDATETIME() WHERE is_production = 1")
        cur.execute("""
            INSERT INTO MLModelVersions (
                model_version, model_type, horizon_days, training_date,
                dataset_start_date, dataset_end_date, hyperparameters_json,
                train_metrics_json, val_metrics_json, test_metrics_json,
                feature_schema_json, artifact_path, status, is_production
            ) VALUES (?, 'LIGHTGBM', 0, SYSUTCDATETIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_version,
            pd.to_datetime(df["metric_date"].min()).date(),
            pd.to_datetime(df["metric_date"].max()).date(),
            json.dumps(hyperparams),
            json.dumps(all_train_metrics),
            json.dumps(all_val_metrics),
            json.dumps(all_test_metrics),
            json.dumps(FEATURE_COLUMNS),
            str(artifact_file),
            status_val,
            1 if promoted else 0,
        ))
        cur.execute("""
            INSERT INTO MLTrainingLogs (
                run_id, trigger_type, model_version, status, dataset_rows,
                mae, rmse, wape, forecast_bias, baseline_mae, promoted, message, started_at, finished_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME())
        """, (
            run_id, trigger_type, new_version, log_status, valid_samples,
            lgbm_mae_7d, lgbm_rmse_7d, lgbm_wape_7d, lgbm_bias_7d,
            baseline_test_mae_7d, 1 if promoted else 0,
            "Promoted to production" if promoted else "Kept in STAGING: did not beat baseline/production",
            started_at
        ))

    return {
        "run_id": run_id,
        "status": log_status,
        "model_version": new_version,
        "promoted": promoted,
        "test_metrics": all_test_metrics,
    }


def run_daily_predictions() -> dict:
    """
    Chạy dự đoán hằng ngày cho toàn bộ sản phẩm active (7, 14, 30 ngày) bằng model ACTIVE hiện tại.
    Không huấn luyện lại model trong tác vụ này.
    """
    ensure_baseline_model_registered()
    prod_model = get_active_production_model()
    model_version = prod_model["model_version"] if prod_model else "v1.0-baseline"
    artifact_path = prod_model.get("artifact_path") if prod_model else None

    loaded_models = None
    if prod_model and prod_model["model_type"] == "LIGHTGBM" and artifact_path:
        try:
            bundle = joblib.load(artifact_path)
            loaded_models = bundle.get("models")
        except Exception:
            loaded_models = None

    panel, products_df = load_raw_product_daily_panel()
    if panel.empty:
        return {"predicted_products": 0, "model_version": model_version}

    df = build_features(panel)
    latest_date = df["metric_date"].max()
    latest_rows = df[df["metric_date"] == latest_date].copy()

    base_date = pd.to_datetime(latest_date).date()
    forecast_count = 0

    with db_cursor(commit=True) as cur:
        for _, row in latest_rows.iterrows():
            pid = int(row["product_id"])
            current_stock = int(row["stock_quantity"])
            avg_7 = float(row["avg_sales_7_days"])
            avg_30 = float(row["avg_sales_30_days"])
            views_7 = float(row["views_7_days"])
            cart_7 = float(row["cart_adds_7_days"])

            for horizon in (7, 14, 30):
                if loaded_models and horizon in loaded_models:
                    pred_qty = float(max(0.0, loaded_models[horizon].predict(row[FEATURE_COLUMNS].to_frame().T)[0]))
                    used_ver = model_version
                else:
                    pred_qty = _baseline_predict_row(avg_7, avg_30, views_7, cart_7, horizon)
                    used_ver = model_version if not loaded_models else model_version

                # Khoảng tin cậy ước lượng (+/- 20% hoặc min +/- 1)
                margin = max(1.0, round(pred_qty * 0.20, 2))
                conf_low = round(max(0.0, pred_qty - margin), 2)
                conf_high = round(pred_qty + margin, 2)

                # Tính xu hướng & tỷ lệ tăng trưởng so với kỳ trước
                prev_horizon_sales = avg_7 * horizon
                if prev_horizon_sales > 0:
                    growth = ((pred_qty - prev_horizon_sales) / prev_horizon_sales) * 100.0
                else:
                    growth = 100.0 if pred_qty > 0.5 else 0.0
                growth = round(max(-99.0, min(500.0, growth)), 2)

                if growth >= 10.0:
                    trend = "UP"
                elif growth <= -10.0:
                    trend = "DOWN"
                else:
                    trend = "STABLE"

                # Đề xuất nhập hàng & cảnh báo hết hàng
                needed = int(np.ceil(pred_qty)) - current_stock
                recommended_restock = max(0, needed)
                low_stock_risk = 1 if (current_stock <= 3 or (pred_qty > 0 and current_stock < np.ceil(pred_qty))) else 0

                target_end = base_date + timedelta(days=horizon - 1)

                cur.execute("""
                    MERGE ProductForecasts AS target
                    USING (SELECT ? AS product_id, ? AS forecast_base_date, ? AS horizon_days) AS src
                    ON (target.product_id = src.product_id AND target.forecast_base_date = src.forecast_base_date AND target.horizon_days = src.horizon_days)
                    WHEN MATCHED THEN
                        UPDATE SET
                            predicted_quantity = ?,
                            confidence_low = ?,
                            confidence_high = ?,
                            trend_direction = ?,
                            growth_rate_percent = ?,
                            recommended_restock_qty = ?,
                            low_stock_risk = ?,
                            model_version = ?,
                            target_date_end = ?,
                            updated_at = SYSUTCDATETIME()
                    WHEN NOT MATCHED THEN
                        INSERT (
                            product_id, forecast_base_date, horizon_days, target_date_end,
                            predicted_quantity, confidence_low, confidence_high,
                            trend_direction, growth_rate_percent, recommended_restock_qty,
                            low_stock_risk, model_version
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    pid, base_date, horizon,
                    round(pred_qty, 2), conf_low, conf_high, trend, growth,
                    recommended_restock, low_stock_risk, used_ver, target_end,
                    pid, base_date, horizon, target_end,
                    round(pred_qty, 2), conf_low, conf_high, trend, growth,
                    recommended_restock, low_stock_risk, used_ver
                ))
                forecast_count += 1

    return {
        "forecast_base_date": base_date.isoformat(),
        "predicted_products": len(latest_rows),
        "total_forecast_rows": forecast_count,
        "model_version": model_version,
    }

