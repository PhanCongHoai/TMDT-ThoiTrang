import logging
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

from app.config import AI_INTERNAL_API_KEY
from app.db import db_cursor
from app.trainer import (
    train_models,
    run_daily_predictions,
    get_active_production_model,
    ensure_baseline_model_registered,
)
from app.evaluator import evaluate_completed_forecasts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AI-Service] %(message)s",
)
logger = logging.getLogger("auralie-ai")

app = FastAPI(
    title="AURALIÈ Haute Couture — AI Product Demand Forecasting Service",
    version="1.0.0",
)


def verify_internal_key(x_internal_api_key: Optional[str]):
    if not x_internal_api_key or x_internal_api_key != AI_INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Internal AI API Key")


class TrainRequest(BaseModel):
    trigger_type: str = Field(default="MANUAL", pattern="^(MANUAL|MONTHLY_SCHEDULED|EARLY_DRIFT_TRIGGER)$")
    force: bool = False


class PredictRequest(BaseModel):
    product_id: Optional[int] = Field(default=None, gt=0)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auralie-ai-demand-forecasting"}


@app.get("/ready")
def readiness_check():
    try:
        with db_cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            cur.execute("""
                SELECT TOP 1 model_version, model_type, status
                FROM MLModelVersions
                WHERE is_production = 1 AND status = 'ACTIVE'
                ORDER BY id DESC
            """)
            row = cur.fetchone()
            return {
                "status": "ready",
                "db_connected": True,
                "active_model": {
                    "model_version": row[0],
                    "model_type": row[1],
                    "status": row[2],
                } if row else None,
            }
    except Exception as exc:
        logger.error("Readiness check failed: %s", exc)
        raise HTTPException(status_code=503, detail="Database or model registry unavailable")


@app.post("/api/ml/train")
def api_train(req: TrainRequest, x_internal_api_key: Optional[str] = Header(default=None)):
    verify_internal_key(x_internal_api_key)
    logger.info(f"Training triggered: type={req.trigger_type}, force={req.force}")
    try:
        result = train_models(trigger_type=req.trigger_type, force=req.force)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.exception("Training failed")
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.post("/api/ml/predict")
def api_predict(req: PredictRequest = PredictRequest(), x_internal_api_key: Optional[str] = Header(default=None)):
    verify_internal_key(x_internal_api_key)
    logger.info("Running daily predictions with active production model")
    try:
        result = run_daily_predictions()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/api/ml/evaluate")
def api_evaluate(x_internal_api_key: Optional[str] = Header(default=None)):
    verify_internal_key(x_internal_api_key)
    logger.info("Running weekly model evaluation on completed forecast windows")
    try:
        result = evaluate_completed_forecasts()
        return {"status": "success", "data": result}
    except Exception as e:
        logger.exception("Evaluation failed")
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")


@app.get("/api/ml/forecast")
def api_get_forecast(
    days: int = Query(default=7, ge=7, le=30),
    x_internal_api_key: Optional[str] = Header(default=None),
):
    verify_internal_key(x_internal_api_key)
    if days not in (7, 14, 30):
        raise HTTPException(status_code=400, detail="Tham số days chỉ hỗ trợ 7, 14 hoặc 30.")

    with db_cursor() as cur:
        cur.execute("""
            SELECT TOP 1 forecast_base_date FROM ProductForecasts ORDER BY forecast_base_date DESC
        """)
        row = cur.fetchone()
        if not row:
            return {"status": "success", "data": {"horizon_days": days, "items": [], "message": "Chưa có dữ liệu dự báo."}}
        latest_base_date = row[0]

        cur.execute("""
            SELECT 
                pf.product_id, p.name AS product_name, c.name AS category_name,
                pf.forecast_base_date, pf.horizon_days, pf.target_date_end,
                CAST(pf.predicted_quantity AS FLOAT) AS predicted_quantity,
                CAST(pf.confidence_low AS FLOAT) AS confidence_low,
                CAST(pf.confidence_high AS FLOAT) AS confidence_high,
                pf.trend_direction, CAST(pf.growth_rate_percent AS FLOAT) AS growth_rate_percent,
                pf.recommended_restock_qty, pf.low_stock_risk, pf.model_version
            FROM ProductForecasts pf
            JOIN products p ON pf.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE pf.forecast_base_date = ? AND pf.horizon_days = ?
            ORDER BY pf.predicted_quantity DESC
        """, (latest_base_date, days))
        cols = [d[0] for d in cur.description]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]

    return {
        "status": "success",
        "data": {
            "forecast_base_date": latest_base_date.isoformat(),
            "horizon_days": days,
            "items": items,
        },
    }


@app.get("/api/ml/model/metrics")
def api_model_metrics(x_internal_api_key: Optional[str] = Header(default=None)):
    verify_internal_key(x_internal_api_key)
    ensure_baseline_model_registered()
    prod = get_active_production_model()
    with db_cursor() as cur:
        cur.execute("""
            SELECT TOP 10 run_id, trigger_type, model_version, status, dataset_rows,
                   CAST(mae AS FLOAT) AS mae, CAST(rmse AS FLOAT) AS rmse,
                   CAST(wape AS FLOAT) AS wape, CAST(forecast_bias AS FLOAT) AS forecast_bias,
                   promoted, message, started_at
            FROM MLTrainingLogs
            ORDER BY started_at DESC
        """)
        cols = [d[0] for d in cur.description]
        logs = [dict(zip(cols, r)) for r in cur.fetchall()]
    return {"status": "success", "data": {"active_model": prod, "recent_logs": logs}}


@app.get("/api/ml/model/status")
def api_model_status(x_internal_api_key: Optional[str] = Header(default=None)):
    verify_internal_key(x_internal_api_key)
    ensure_baseline_model_registered()
    prod = get_active_production_model()
    with db_cursor() as cur:
        cur.execute("SELECT COUNT(DISTINCT metric_date) FROM ProductDailyMetrics WHERE total_units_sold > 0")
        days_count = int(cur.fetchone()[0])
    return {
        "status": "success",
        "data": {
            "active_model": prod,
            "mode": prod["model_type"] if prod else "UNINITIALIZED",
            "metric_days_with_sales": days_count,
        },
    }

