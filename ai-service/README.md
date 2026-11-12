# AURALIÈ Haute Couture — Python AI Demand Forecasting Service

## Cài đặt & Chạy
```bash
cd ai-service
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Các Endpoint chính (yêu cầu header `X-Internal-API-Key`)
- `GET /health`
- `POST /api/ml/train`
- `POST /api/ml/predict`
- `POST /api/ml/evaluate`
- `GET /api/ml/forecast?days=7|14|30`
- `GET /api/ml/model/metrics`
- `GET /api/ml/model/status`

