# BÁO CÁO VẬN HÀNH & ĐỘ BỀN AI SERVICE (AI SERVICE OPERATIONS)

**Ngày cập nhật:** 2026-11-12  
**Phạm vi:** `ai-service/app/main.py`, `backend/src/modules/analytics/analytics.service.js`, `backend/src/jobs/mlLifecycle.job.js`

---

## 1. Endpoints Kiểm Tra Sức Khỏe & Sẵn Sàng (FastAPI)

| Endpoint | Mục đích | Kết quả kiểm tra thực tế |
|---|---|---|
| `GET /health` | Liveness check của dịch vụ FastAPI | `200 OK` (`{"status": "ok", "service": "auralie-ai-demand-forecasting"}`) |
| `GET /ready` | Readiness check: kiểm tra kết nối SQL Server (`SELECT 1`) & model `ACTIVE` trong `MLModelVersions` (không lộ secret) | `200 OK` (`db_connected: true`, `active_model: v1.0-baseline`); trả `503` nếu lỗi DB |
| `POST /api/ml/*` với `X-Internal-API-Key` sai | Bảo vệ internal ML endpoints | `401 Unauthorized` |

---

## 2. Cơ Chế Chịu Lỗi & Chống Xung Đột (Node.js Backend)

1. **`callPythonAI(...)` (`analytics.service.js`):**
   - Áp dụng `AbortController` timeout (`15s`–`30s` tùy tác vụ).
   - Bổ sung **bounded retry (`maxRetries = 2`, backoff `300ms`, `600ms`)** cho lỗi kết nối/timeout hoặc HTTP `5xx`.
   - Không retry đối với lỗi client `4xx` (`400`, `401`, `403`, `404`) để tránh lãng phí tài nguyên.
2. **ML Lifecycle Scheduler (`mlLifecycle.job.js`):**
   - Bổ sung khóa chống chạy chồng lấn (`isTickRunning` mutex): nếu tick mới kích hoạt khi tick cũ chưa xong sẽ trả về `{ status: 'SKIPPED', reason: 'CONCURRENT_RUN_IN_PROGRESS' }`.
   - Trả về cấu trúc trạng thái rõ ràng cho từng bước (`aggregation`, `prediction`, `evaluation`, `retraining`: `SUCCESS` / `FAILED` / `SKIPPED`) kèm `getLifecycleStatus()`.
   - Khi AI Service offline, backend ghi nhận cảnh báo `FAILED` cho bước tương ứng nhưng **không làm crash server Express** hay ảnh hưởng nghiệp vụ bán hàng.

---

## 3. Hướng Dẫn Khởi Động Toàn Hệ Thống

- **Backend (Port 3000):** `cd backend && npm start`
- **AI Service (Port 8000):** `cd ai-service && uvicorn app.main:app --host 127.0.0.1 --port 8000`
- **Frontend (Port 5173):** `cd frontend && npm run dev`

