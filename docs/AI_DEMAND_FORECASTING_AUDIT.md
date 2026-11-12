# PHASE 1: BÁO CÁO KIỂM TOÁN SOURCE CODE & DỮ LIỆU
## HỆ THỐNG AI PRODUCT DEMAND FORECASTING — AURALIÈ HAUTE COUTURE

**Ngày kiểm toán:** 12/11/2026  
**Cơ sở dữ liệu kiểm tra:** Microsoft SQL Server 2022 (`AURALIE_FashionDB`)  
**Môi trường Python:** Python 3.13.7, pip 25.2 (đã cài sẵn trên máy)  
**Trạng thái:** Chỉ kiểm toán — **Chưa viết code triển khai**

---

## 1. KIẾN TRÚC CÔNG NGHỆ THỰC TẾ

| Tầng hệ thống | Công nghệ thực tế trong Source Code | Ghi chú tương thích |
|---|---|---|
| **Frontend** | **Vite 5.4 + HTML5 + CSS3 + Vanilla JS (MPA)** gồm 15 trang `.html` | Không phải ReactJS SPA. Giao diện AI Forecasting sẽ tích hợp đồng bộ vào `frontend/admin.html` (dùng Chart.js). |
| **Backend** | **Node.js (CommonJS) + Express 4** (Clean Modular Architecture tại `backend/src/modules/`) | Đóng vai trò API Gateway trung gian gọi Python FastAPI, kiểm tra quyền Admin và cache kết quả. |
| **Database** | **Microsoft SQL Server 2022** (`AURALIE_FashionDB`) | Kết nối qua `mssql` (Node.js) và `pyodbc` / `sqlalchemy` (Python). |
| **AI/ML Service** | **Chưa có** (sẽ xây dựng mới bằng **Python 3.13 + FastAPI + LightGBM + XGBoost + Scikit-learn**) | Chạy độc lập như microservice nội bộ, xác thực qua Internal API Key. |

---

## 2. KIỂM TOÁN CẤU TRÚC BẢNG & DỮ LIỆU THỰC TẾ TRONG SQL SERVER

### 2.1 Khối lượng dữ liệu thực tế (`AURALIE_FashionDB`)
Qua truy vấn trực tiếp trên SQL Server:
- **`products`**: 20 sản phẩm (`is_active = 1`), **`product_variants`**: 14 biến thể, **`categories`**: 5 danh mục.
- **`users`**: 12 tài khoản.
- **`orders`**: 67 đơn hàng, **`order_items`**: 62 dòng chi tiết.
- **`payment_transactions`**: 36 giao dịch.
- **`wishlists`**: 4 lượt thích, **`product_reviews`**: 6 đánh giá, **`inventory_imports`**: 3 lô nhập.
- **Khoảng thời gian lịch sử đơn hàng:** Từ `2026-10-16` đến `2026-11-05`, phát sinh trên **6 ngày khác nhau** (`distinct_order_days = 6`).
- **Độ phủ sản phẩm có đơn hàng:** **4 / 20 sản phẩm** từng được đặt mua.

### 2.2 Kiểm tra chi tiết các bảng liên quan
1. **Bảng `products`:** Các cột hiện có: `id`, `name`, `slug`, `description`, `base_price`, `category_id`, `tag`, `material`, `fit`, `lining`, `hardware`, `origin`, `is_active`, `created_at`.
   - **Lưu ý:** Không có cột `brand_id`, `original_price`, hay `discount_percent`. Giá gốc dùng `base_price` (hoặc `product_variants.variant_price`). Khuyến mãi hiện áp dụng theo đơn hàng qua bảng `coupons`, không gắn trực tiếp trên từng sản phẩm.
2. **Bảng `orders` & `order_items`:**
   - Trạng thái đơn (`orders.status`): `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`.
   - Trạng thái thanh toán (`orders.payment_status`): `UNPAID`, `PARTIALLY_PAID`, `PAID`, `REFUNDED`.
   - Phân bố 67 đơn hiện tại: `CONFIRMED/UNPAID` (27 — đơn COD), `CONFIRMED/PAID` (21), `CANCELLED/UNPAID` (7), `PENDING/PARTIALLY_PAID` (4), `PENDING/UNPAID` (3), `PENDING/PAID` (2), `PROCESSING/PAID` (1), `SHIPPED/PAID` (1), `COMPLETED/PAID` (1).
   - **Vấn đề phát hiện tại `admin.routes.js` (`GET /api/v1/admin/stats`):** Hiện đang tính `SUM(total_amount)` trên **toàn bộ** bảng `orders` (bao gồm cả 7 đơn `CANCELLED` và 7 đơn `PENDING`). Pipeline AI tuyệt đối **không dùng công thức này**, mà chỉ tính nhu cầu thực từ các đơn hợp lệ (`status NOT IN ('CANCELLED')` và đối với Online phải `payment_status = 'PAID'` hoặc `status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')`).
3. **Tồn kho (`product_variants` & `inventory_imports`):**
   - `product_variants.stock_quantity` chỉ lưu **tồn kho hiện tại**, không có lịch sử biến động tồn kho theo ngày để tính `out_of_stock_days` hay `average_restock_time`.
   - `inventory_imports` chỉ lưu tổng số lượng và tổng chi phí theo lô, không liên kết tới `product_id`/`variant_id`.
   - Vì vậy, cần bảng `ProductInventorySnapshots` (chụp tồn kho cuối mỗi ngày) để có dữ liệu lịch sử cho tương lai.
4. **Dữ liệu hành vi (Views, Add-to-Cart, Wishlists):**
   - `wishlists` (4 bản ghi) đã có sẵn.
   - `views` và `cart_adds` **chưa có** trong hệ thống hiện tại (phụ thuộc vào hệ thống User Behavior Tracking đang lên kế hoạch). Trước khi hệ thống tracking thu thập đủ dữ liệu, các feature hành vi (`views_*`, `cart_adds_*`) cần được xử lý an toàn (`0` hoặc `NULL`/chỉ báo thiếu dữ liệu) thay vì giả lập.

---

## 3. KIỂM TRA API & PHÂN QUYỀN HIỆN CÓ

- **Authentication & Authorization (`backend/src/middlewares/auth.middleware.js`):**
  - `verifyToken`: Xác thực JWT từ header `Authorization: Bearer <token>`.
  - `requireAdmin`: Kiểm tra `req.user.role === 'ADMIN'`, trả về `403 Forbidden` nếu không phải Admin.
- **API có thể tái sử dụng:**
  - `GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/categories` (metadata sản phẩm/danh mục).
  - `GET /api/v1/orders` (quản lý đơn hàng Admin).

---

## 4. ĐÁNH GIÁ KHẢ NĂNG HUẤN LUYỆN MÔ HÌNH ML HIỆN TẠI (TRUNG THỰC & KHOA HỌC)

1. **Hạn chế dữ liệu hiện tại:**
   - Chỉ có **6 ngày phát sinh đơn hàng** và **4/20 sản phẩm có lịch sử bán**.
   - Các đặc trưng dài hạn như `sales_14_days_ago`, `sales_28_days_ago`, `avg_sales_30_days`, `out_of_stock_days` hoặc **Walk-forward Validation cho horizon 14/30 ngày** chưa đủ số lượng mẫu để LightGBM học ổn định và cho sai số tin cậy.
2. **Giải pháp kiến trúc đề xuất (Không tạo dữ liệu giả):**
   - **Cơ chế Hybrid / Adaptive Baseline:**
     - Khi dữ liệu lịch sử chưa đạt ngưỡng tối thiểu (ví dụ: `< 30 ngày` lịch sử hoặc `< 50` dòng dữ liệu bán hàng có nghĩa), hệ thống **báo cáo rõ trạng thái `INSUFFICIENT_DATA_USING_BASELINE`** trên `/api/ml/model/status` và tự động sử dụng **Statistical Baseline** (Moving Average + Weighted Recent Trend + Wishlist/Stock signals) để đưa ra dự báo tham khảo minh bạch.
     - Khi dữ liệu thực tế tích lũy đủ (từ đơn hàng thật + `ProductDailyMetrics` + `ProductInventorySnapshots`), pipeline tự động huấn luyện **LightGBM Regressor** (kèm đối chứng Moving Average & XGBoost) và chỉ promote model mới nếu metrics (`MAE`, `RMSE`, `WAPE`) vượt qua Baseline.

---

## 5. KẾ HOẠCH TRIỂN KHAI PHÙ HỢP VỚI SOURCE CODE THỰC TẾ

- **Phase 2 – Database Migration & Rollback:** Tạo 5 bảng mới trong SQL Server (`ProductDailyMetrics`, `ProductForecasts`, `MLModelVersions`, `MLTrainingLogs`, `ProductInventorySnapshots`) kèm script rollback, không sửa đổi các bảng nghiệp vụ hiện có.
- **Phase 3 – Data Collection & Feature Engineering (Python):** Xây dựng ETL đọc dữ liệu sạch từ SQL Server (loại trừ đơn `CANCELLED`/chưa thanh toán không hợp lệ), xử lý missing features (`brand_id` không có -> bỏ qua hoặc dùng `category_id`/`tag`), chống data leakage theo mốc thời gian.
- **Phase 4 – ML Training & Baseline Fallback (Python):** Huấn luyện LightGBM + XGBoost + Moving Average baseline; hỗ trợ fallback an toàn khi thiếu dữ liệu lịch sử và lưu model metadata (`MLModelVersions`, `MLTrainingLogs`).
- **Phase 5 – Python FastAPI AI Service (`ai-service/`):** Xây dựng các endpoint `/api/ml/train`, `/api/ml/predict`, `/api/ml/forecast?days=7|14|30`, `/api/ml/model/metrics`, `/api/ml/model/status` kèm Internal API Key auth, `requirements.txt`, `.env.example`.
- **Phase 6 – Node.js Integration (`backend/src/modules/ai/`):** Bổ sung 5 endpoint `/api/admin/ai/*` có `verifyToken + requireAdmin`, timeout handling, đọc cache từ `ProductForecasts`.
- **Phase 7 – Admin Dashboard UI (`frontend/admin.html`):** Tích hợp tab **AI Product Demand Forecasting** (Overview, Top Predicted Products, Forecast Chart 7/14/30 ngày bằng Chart.js, Product Analysis, Inventory Recommendation) đồng bộ giao diện Luxury hiện tại.
- **Phase 8 – Automation & Testing:** Job tổng hợp hằng ngày (`ProductDailyMetrics`, `ProductInventorySnapshots`), kiểm thử 10 kịch bản nghiệm thu (cold-start product, đơn hủy, thiếu dữ liệu, RBAC Admin, so sánh Baseline).


---

## 6. TÍCH HỢP KIẾN TRÚC CONTINUOUS LEARNING & MODEL LIFECYCLE MANAGEMENT

Bổ sung vào lộ trình triển khai để đảm bảo mô hình AI vận hành bền vững, không ghi đè dữ liệu lịch sử và kiểm soát chặt chất lượng dự báo:

1. **Data Collection & Daily Feature Processing (Append-Only, Idempotent):**
   - Dùng `MERGE` / `UNIQUE(product_id, metric_date)` trên `ProductDailyMetrics` và `UNIQUE(product_id, snapshot_date)` trên `ProductInventorySnapshots` để tổng hợp dữ liệu từng ngày mà không ghi đè hoặc trùng lặp lịch sử.
   - Chỉ sử dụng dữ liệu có sẵn tại thời điểm dự đoán (`metric_date <= forecast_base_date`).
2. **Daily Prediction & Historical Forecast Audit:**
   - Bảng `ProductForecasts` lưu cả `forecast_base_date`, `target_date_end`, `horizon_days` (7/14/30), `predicted_quantity`, `actual_quantity` (cập nhật sau khi kỳ dự báo kết thúc), `model_version` để đối chiếu **Prediction vs Actual** và tính **Forecast Bias / MAE / RMSE / WAPE** thực tế.
3. **Model Version Management & Safe Rollback:**
   - Bảng `MLModelVersions` quản lý `model_version` (`v1.0`, `v1.1`...), `training_date`, `dataset_start_date`, `dataset_end_date`, `train_metrics_json`, `val_metrics_json`, `test_metrics_json`, `feature_schema_json`, `artifact_path`, `status` (`STAGING`, `ACTIVE`, `ARCHIVED`, `FAILED`), `is_production`.
   - Hỗ trợ **rollback tức thời** bằng cách chuyển cờ `is_production` về phiên bản trước đó nếu model mới xuống cấp.
4. **Automatic Retraining & Failure Handling:**
   - Job kiểm tra chất lượng dữ liệu hằng ngày, đánh giá sai số hằng tuần (chỉ đánh giá các kỳ dự báo đã kết thúc), xem xét retrain hằng tháng hoặc sớm hơn nếu WAPE/Bias vượt ngưỡng.
   - Nếu dữ liệu lỗi/thiếu hoặc model mới kém hơn model `ACTIVE` hiện tại → giữ nguyên model production hiện tại và ghi log vào `MLTrainingLogs`.
   - Nếu Python AI Service gặp sự cố → Node.js chỉ trả cảnh báo ở trang Admin và **không ảnh hưởng** đến luồng mua hàng/thanh toán của khách hàng.
