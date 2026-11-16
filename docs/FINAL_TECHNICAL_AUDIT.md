# BÁO CÁO KIỂM TOÁN KỸ THUẬT CUỐI CÙNG (FINAL TECHNICAL AUDIT)

**Dự án:** AURALIÈ Haute Couture (`PhanCongHoai/TMDT-ThoiTrang`)  
**Cơ sở dữ liệu:** Microsoft SQL Server (`AURALIE_FashionDB`)  
**Commit cơ sở (Git checkpoint):** `4190dfd` (`main`)  
**Ngày kiểm toán:** 2026-11-12  

---

## 1. Tóm Tắt Điều Hành (Executive Summary)

Đợt kiểm toán thực tế trên source code và cơ sở dữ liệu `AURALIE_FashionDB` cho thấy hạ tầng lõi của hệ thống **User Behavior Tracking** và **AI Demand Forecasting** đã được xây dựng đúng kiến trúc (Express + SQL Server + FastAPI + Vite MPA), không tạo bảng trùng lặp, có ràng buộc toàn vẹn (PK/FK/UNIQUE/CHECK/ISJSON) và bảo mật admin/API key rõ ràng.

Tuy nhiên, vẫn còn **4 nhóm thiếu sót/hạn chế thực tế** cần hoàn thiện và kiểm chứng ở các pha tiếp theo:
1. **Frontend UI Event Tracking chưa đầy đủ (FAIL):** Mới gắn `page_view`, `scroll_depth`, `product_view`, `category_view`, `search`, `search_no_result`, `add_to_cart`, `logout`. Còn thiếu `banner_view`, `banner_click`, `product_variant_select`, `product_image_view`, `remove_from_cart`, `update_cart_quantity` (`cart_update`), `checkout_start`, `checkout_information_submit`, `coupon_apply`, và chưa đối soát ghi nhận `purchase` từ server-side đơn hàng/thanh toán.
2. **Customer Journey trên Admin Dashboard chưa hoàn chỉnh (FAIL):** `AnalyticsService.getCustomerJourney(userId)` hiện chỉ trả về 3 bộ đếm tổng hợp + 10 đơn hàng gần nhất (chưa có timeline sự kiện chi tiết, bộ lọc, phân trang, danh sách session); tab *Khách Hàng VIP* trong `frontend/admin.html` chưa có nút xem hành trình và modal/drawer chi tiết.
3. **Vận hành & Độ bền AI Service + Lifecycle Job (PARTIAL):** FastAPI chưa có `GET /ready` kiểm tra kết nối DB & trạng thái model; `mlLifecycle.job.js` chưa có khóa chống chạy chồng lấn (concurrency mutex) và `callPythonAI` chưa có cơ chế retry hữu hạn khi lỗi mạng/tạm thời.
4. **Tính sẵn sàng dữ liệu cho ML (BLOCKED đối với LightGBM trên dữ liệu thực):** Cơ sở dữ liệu hiện chỉ có **60 đơn hàng hợp lệ** (trên tổng 67 đơn) trải trên **6 ngày bán hàng phân biệt** (`2026-10-16` đến `2026-11-05`), chỉ phủ **4 / 20 sản phẩm đang hoạt động**. Vì `valid_sales_days = 6 < 30`, mô hình LightGBM/XGBoost **chưa đủ dữ liệu lịch sử thực tế để huấn luyện và kiểm chứng độ chính xác**; hệ thống đang dùng `v1.0-baseline` (`MOVING_AVERAGE_BASELINE`).

---

## 2. Kết Quả Kiểm Toán Database (`AURALIE_FashionDB`)

### 2.1. Kiểm tra tồn tại bảng & số lượng bản ghi thực tế

| Bảng | Nhóm | Số dòng thực tế | Trạng thái |
|---|---|---:|---|
| `products` | Core E-commerce | 20 | PASS |
| `product_variants` | Core E-commerce | 14 | PASS |
| `orders` | Core E-commerce | 67 | PASS |
| `order_items` | Core E-commerce | 62 | PASS |
| `users` | Core E-commerce | 12 | PASS |
| `abandoned_carts` | Core + Tracking (`anonymous_id`, `session_id`) | 1 | PASS |
| `user_sessions` | Behavior Tracking | 0 | PASS (Chưa có traffic thực) |
| `user_events` | Behavior Tracking | 0 | PASS (Chưa có traffic thực) |
| `user_search_history` | Behavior Tracking | 0 | PASS |
| `product_interactions` | Behavior Tracking | 0 | PASS |
| `tracking_consents` | Privacy / Consent | 0 | PASS |
| `user_behavior_daily` | Daily Aggregation | 1 | PASS |
| `ProductDailyMetrics` | AI Feature Store | 20 | PASS |
| `ProductInventorySnapshots` | AI Inventory History | 20 | PASS |
| `ProductForecasts` | AI Forecast Output | 60 (20 SP x 3 horizons) | PASS |
| `MLModelVersions` | ML Model Registry | 1 (`v1.0-baseline`) | PASS |
| `MLTrainingLogs` | ML Lifecycle Audit | 1 | PASS |
| `MLMonitoringAlerts` | ML Drift/Error Alerts | 0 | PASS |

### 2.2. Kiểm tra Constraints, Indexes & Toàn Vẹn Dữ Liệu

- **Primary Keys & Foreign Keys:** Tất cả 12 bảng mới đều có `PRIMARY KEY`, khóa ngoại `FOREIGN KEY` trỏ đúng về `products`, `users`, `categories`, `user_sessions`.
- **Check Constraints:**
  - `user_events`: `ISJSON([event_properties]) = 1`
  - `user_search_history`: `ISJSON([filters_json]) = 1`
  - `tracking_consents`: `consent_status IN ('GRANTED', 'DENIED')`
  - `ProductForecasts`: `horizon_days IN (7, 14, 30)`
  - `MLModelVersions`: `status IN ('TRAINING', 'STAGING', 'ACTIVE', 'ARCHIVED', 'FAILED', 'ROLLED_BACK')`
  - `MLMonitoringAlerts`: `severity IN ('INFO', 'WARNING', 'CRITICAL')`
- **Unique Constraints & Deduplication:**
  - `user_events.event_id`: `UNIQUE`, kiểm tra trùng lặp thực tế = `0`.
  - `ProductForecasts`: `UQ_ProductForecast` trên `(product_id, forecast_base_date, horizon_days, model_version)`, kiểm tra trùng lặp thực tế = `0`.
  - `ProductDailyMetrics` (`UQ_ProductDailyMetrics`), `ProductInventorySnapshots` (`UQ_InventorySnapshot`), `user_behavior_daily` (`UQ_UserBehaviorDaily`), `MLModelVersions.model_version`: đều có `UNIQUE`.
- **Indexes:** Đã có các non-clustered index tối ưu cho truy vấn hành vi và AI (`IX_Events_User_Time`, `IX_Events_Anon_Time`, `IX_Events_Product_Time`, `IX_Events_Name_Time`, `IX_Events_Session`, `IX_Forecast_Eval`, `IX_Sessions_User`, `IX_Sessions_Anon`, v.v.).

### 2.3. Kiểm tra Tính Sẵn Sàng Dữ Liệu (AI Data Readiness)

- Tổng số đơn hàng: **67** (`60` đơn hợp lệ, `7` đơn `CANCELLED`).
- Khoảng thời gian đơn hàng: `2026-10-16` đến `2026-11-05`.
- Số ngày có đơn hàng hợp lệ (`valid_sales_days`): **6 ngày**.
- Số sản phẩm active có ít nhất 1 đơn hàng: **4 / 20 sản phẩm** (tỷ lệ phủ sản phẩm 20%).
- Kết luận Data Readiness: **Chưa đủ điều kiện tối thiểu (>= 30 ngày lịch sử & đủ độ phủ sản phẩm) để huấn luyện LightGBM/XGBoost trên dữ liệu thật.** Trạng thái: **BLOCKED (do thiếu dữ liệu lịch sử thật)** — cần giữ `MOVING_AVERAGE_BASELINE` ở production và dùng bộ dữ liệu kiểm thử tách biệt (`TEST DATA`, có dọn dẹp) để kiểm chứng pipeline train/evaluate/compare/rollback.

---

## 3. Ma Trận Kiểm Toán Thành Phần & Kế Hoạch Hoàn Thiện

| Hạng mục | Trạng thái hiện tại | Phát hiện chính | Hành động khắc phục |
|---|---|---|---|
| Database Schema & Constraints | **PASS** | Đủ 12 bảng mới + cột `abandoned_carts`, không trùng bảng, 0 duplicate | Giữ nguyên schema, không sửa phá vỡ |
| Backend Tracking Ingestion API | **PASS** | `/api/tracking/*` có sanitize PII, rate limit 120/min, consent check, batch up to 50 | Bổ sung server-side `purchase` recording khi đơn hàng xác nhận/thanh toán |
| Frontend Tracking SDK & UI Hooks | **FAIL** | Thiếu 9+ sự kiện UI quan trọng (`banner_*`, `variant_select`, `image_view`, `remove_from_cart`, `cart_update`, `checkout_*`, `coupon_apply`) | Hoàn thiện ở **Phase 2** |
| Customer Journey (API + Admin UI) | **FAIL** | API chưa trả về timeline/session/filter/pagination; Admin UI chưa có modal/drawer | Hoàn thiện ở **Phase 3** |
| AI Service Operations & Lifecycle | **PARTIAL** | Thiếu `GET /ready`, chưa có concurrency lock & retry ở `mlLifecycle.job.js` | Hoàn thiện ở **Phase 4** |
| AI Model Accuracy Validation | **BLOCKED (Live Data)** | Live DB chỉ có 6 ngày bán hàng; cần thêm Naive/MA/LightGBM/XGBoost comparison & stockout censoring | Hoàn thiện & đo trên test fixture ở **Phase 5** |
| Continuous Learning & Rollback | **PARTIAL** | Chưa kiểm chứng E2E v1 -> v2 -> reject/accept -> rollback với artifact thực tế | Kiểm chứng ở **Phase 6** |

