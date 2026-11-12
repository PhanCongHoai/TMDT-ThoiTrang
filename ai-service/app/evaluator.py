import uuid
import numpy as np
from datetime import datetime, timezone
from app.config import DRIFT_WAPE_THRESHOLD
from app.db import db_cursor


def evaluate_completed_forecasts() -> dict:
    """
    Đánh giá chất lượng dự báo hằng tuần:
    - CHỈ đánh giá các kỳ dự báo đã kết thúc (target_date_end < hôm nay) và chưa từng đánh giá.
    - Đối chiếu Prediction vs Actual từ các đơn hàng hợp lệ (không tính đơn CANCELLED).
    - Tính MAE, WAPE, Forecast Bias và phát hiện Model Drift nếu WAPE vượt ngưỡng.
    """
    run_id = f"EVAL-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    today_vn_sql = "CAST(DATEADD(HOUR, 7, SYSUTCDATETIME()) AS DATE)"

    evaluated_count = 0
    errors = []
    preds = []
    actuals = []
    latest_version = "v1.0-baseline"

    with db_cursor(commit=True) as cur:
        # 1. Lấy các dự báo đã hoàn tất kỳ hạn nhưng chưa có actual_quantity
        cur.execute(f"""
            SELECT id, product_id, forecast_base_date, target_date_end, predicted_quantity, model_version
            FROM ProductForecasts
            WHERE target_date_end < {today_vn_sql}
              AND evaluated_at IS NULL
        """)
        pending_evals = cur.fetchall()

        for row in pending_evals:
            fid, pid, start_d, end_d, pred_qty, m_ver = row
            latest_version = m_ver
            # Tính số lượng bán thực tế hợp lệ trong [start_d, end_d]
            cur.execute("""
                SELECT COALESCE(SUM(oi.quantity), 0) AS actual_sold
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN product_variants pv ON oi.variant_id = pv.id
                WHERE pv.product_id = ?
                  AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
                  AND (o.payment_method = 'COD' OR o.payment_status = 'PAID')
                  AND CAST(DATEADD(HOUR, 7, o.created_at) AS DATE) BETWEEN ? AND ?
            """, (pid, start_d, end_d))
            actual_sold = int(cur.fetchone()[0])
            abs_err = round(abs(float(pred_qty) - float(actual_sold)), 2)

            cur.execute("""
                UPDATE ProductForecasts
                SET actual_quantity = ?, abs_error = ?, evaluated_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
                WHERE id = ?
            """, (actual_sold, abs_err, fid))

            evaluated_count += 1
            preds.append(float(pred_qty))
            actuals.append(float(actual_sold))
            errors.append(float(pred_qty) - float(actual_sold))

        # 2. Tính tổng hợp chỉ số cho tất cả các bản ghi đã có evaluated_at trong 30 ngày qua
        cur.execute("""
            SELECT predicted_quantity, actual_quantity, model_version
            FROM ProductForecasts
            WHERE evaluated_at IS NOT NULL
              AND evaluated_at >= DATEADD(DAY, -30, SYSUTCDATETIME())
        """)
        hist_rows = cur.fetchall()

        if not hist_rows:
            return {
                "run_id": run_id,
                "newly_evaluated": evaluated_count,
                "total_evaluated_30d": 0,
                "message": "Chưa có kỳ dự báo nào kết thúc để đối soát thực tế.",
                "drift_detected": False,
            }

        p_arr = np.array([float(r[0]) for r in hist_rows])
        a_arr = np.array([float(r[1]) for r in hist_rows])
        latest_version = hist_rows[-1][2]

        mae = float(np.mean(np.abs(p_arr - a_arr)))
        rmse = float(np.sqrt(np.mean((p_arr - a_arr) ** 2)))
        total_actual = float(np.sum(np.abs(a_arr)))
        wape = float(np.sum(np.abs(p_arr - a_arr)) / total_actual) if total_actual > 0 else 0.0
        bias = float(np.mean(p_arr - a_arr))

        drift_detected = bool(total_actual > 0 and wape > DRIFT_WAPE_THRESHOLD)

        cur.execute("""
            INSERT INTO MLTrainingLogs (
                run_id, trigger_type, model_version, status, dataset_rows,
                mae, rmse, wape, forecast_bias, promoted, message, finished_at
            ) VALUES (?, 'WEEKLY_EVALUATION', ?, 'SUCCESS', ?, ?, ?, ?, ?, 0, ?, SYSUTCDATETIME())
        """, (
            run_id,
            latest_version,
            len(hist_rows),
            round(mae, 4),
            round(rmse, 4),
            round(wape, 4),
            round(bias, 4),
            "Drift detected - early retrain recommended" if drift_detected else "Evaluation within acceptable threshold",
        ))

        if drift_detected:
            cur.execute("""
                INSERT INTO MLMonitoringAlerts (
                    alert_type, severity, model_version, metric_value, threshold_value, message
                ) VALUES (
                    'MODEL_DRIFT', 'WARNING', ?, ?, ?, ?
                )
            """, (
                latest_version,
                round(wape, 4),
                DRIFT_WAPE_THRESHOLD,
                f"Cảnh báo Model Drift: WAPE thực tế ({round(wape * 100, 1)}%) vượt ngưỡng cho phép ({round(DRIFT_WAPE_THRESHOLD * 100, 1)}%). Khuyến nghị xem xét huấn luyện lại mô hình."
            ))

    return {
        "run_id": run_id,
        "newly_evaluated": evaluated_count,
        "total_evaluated_30d": len(hist_rows),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4),
        "forecast_bias": round(bias, 4),
        "drift_detected": drift_detected,
        "model_version": latest_version,
    }

