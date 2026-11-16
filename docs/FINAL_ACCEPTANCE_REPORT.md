# BÁO CÁO NGHIỆM THU KỸ THUẬT CUỐI CÙNG (FINAL ACCEPTANCE REPORT)

**Dự án:** AURALIÈ Haute Couture (`PhanCongHoai/TMDT-ThoiTrang`)  
**Cơ sở dữ liệu:** Microsoft SQL Server (`AURALIE_FashionDB`)  
**Ngày nghiệm thu:** 2026-11-12  
**Kết luận tổng thể:** **READY WITH LIMITATIONS**

---

## 1. Bảng Tổng Hợp Kết Quả Nghiệm Thu (PASS / FAIL / BLOCKED)

| Hạng mục kiểm tra | Trạng thái | Bằng chứng thực tế | Tài liệu chi tiết |
|---|---|---|---|
| 1. Kiểm toán Schema, Constraints, Indexes, No-Duplicate | **PASS** | 12/12 bảng mới + cột `abandoned_carts`, đủ PK/FK/UNIQUE/CHECK/ISJSON, 0 duplicate | [FINAL_TECHNICAL_AUDIT.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/FINAL_TECHNICAL_AUDIT.md) |
| 2. Event Tracking UI & Server-side `purchase` Idempotency | **PASS** | Gắn đủ 11 UI hooks mới trong `app.js` + `OrderService.recordPurchaseEvent` idempotent; E2E batch 11/11 (`201`) & purchase idempotency (`1` row) | [TRACKING_COMPLETION_REPORT.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/TRACKING_COMPLETION_REPORT.md) |
| 3. Customer Journey API & Admin Modal | **PASS** | `GET /api/admin/analytics/customer/:id` (401/403/200/Filter/Pagination/404) + Modal Hành Trình trong `admin.html` | [CUSTOMER_JOURNEY_REPORT.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/CUSTOMER_JOURNEY_REPORT.md) |
| 4. AI Service Operations (`/health`, `/ready`, Auth, Retry, Mutex) | **PASS** | `/health` `200`, `/ready` `200` (`db_connected: true`), wrong API key `401`, `mlLifecycle.job.js` mutex `["FAILED","SKIPPED"]` khi AI Service offline | [AI_SERVICE_OPERATIONS.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/AI_SERVICE_OPERATIONS.md) |
| 5. Backend Regression Suite (`tracking_and_ai.test.js`) | **PASS** | `6/6 PASSED` (Deduplication, PII Stripping, Search, Consent DENIED, Daily Aggregation, Forecast Cache, Admin RBAC) | `backend/test/tracking_and_ai.test.js` |
| 6. Frontend Production Build (`vite build`) | **PASS** | `24 modules transformed`, built in `469ms`, zero errors | `frontend/dist/` |
| 7. ML Pipeline & Lifecycle (Test Fixture cô lập `TEST DATA`) | **PASS** | Train v1 -> Predict 60 rows -> Evaluate -> Train v2 -> Rollback `v1.0-baseline` + Cleanup sạch | [ML_LIFECYCLE_VALIDATION_REPORT.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/ML_LIFECYCLE_VALIDATION_REPORT.md) |
| 8. Độ chính xác LightGBM/XGBoost trên **dữ liệu thật** | **BLOCKED** | `AURALIE_FashionDB` mới có **6 ngày bán hàng hợp lệ** (`valid_sales_days = 6 < 30`) và **4/20 sản phẩm** có đơn hàng; production dùng `v1.0-baseline` (`MOVING_AVERAGE_BASELINE`) | [AI_MODEL_ACCURACY_REPORT.md](file:///c:/Users/ASUS/Documents/Demo/DATN/docs/AI_MODEL_ACCURACY_REPORT.md) |

---

## 2. Các Lỗi Thực Tế Đã Phát Hiện & Khắc Phục Trong Đợt Kiểm Toán

1. **`ai-service/app/trainer.py` (`run_daily_predictions`):** Lỗi `ValueError: pandas dtypes must be int, float or bool` khi dự đoán bằng LightGBM đã được promote do `row[FEATURE_COLUMNS].to_frame().T` mang kiểu `object` -> Đã sửa bằng `.astype(float)` và clip giá trị âm.
2. **`ai-service/app/trainer.py` (`train_models`):** Tên phiên bản model dùng định dạng phút `%Y%m%d.%H%M` gây lỗi `UNIQUE KEY constraint` nếu train 2 lần trong cùng 1 phút -> Đã sửa thành `%Y%m%d.%H%M%S`.
3. **`backend/src/modules/analytics/analytics.service.js` (`getCustomerJourney`):** Truy vấn nhầm cột `e.os` trên `user_events` và `is_converted` trên `user_sessions` -> Đã sửa đúng theo schema thực tế (`operating_system AS os` trên `user_sessions`).
4. **Dọn dẹp toàn bộ dữ liệu kiểm thử:** Toàn bộ bản ghi test (events, sessions, consents, model versions, training logs, artifacts `.joblib` tạm) đã được xóa sạch khỏi `AURALIE_FashionDB` và `ai-service/artifacts/`, giữ nguyên `v1.0-baseline` (`ACTIVE`) với 60 dự báo hợp lệ.

---

## 3. Điều Kiện Để Gỡ Giới Hạn (`BLOCKED` -> `READY FOR PRODUCTION`)

- Vận hành hệ thống thu thập hành vi & đơn hàng thực tế tối thiểu **>= 30 ngày bán hàng phân biệt** và phủ đa số sản phẩm active (`>= 100` mẫu chuỗi thời gian) để `POST /api/ml/train` tự động mở khóa huấn luyện LightGBM/XGBoost trên dữ liệu thật và theo dõi WAPE/MAE thực tế qua `evaluate_completed_forecasts()`.

