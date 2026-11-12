# PHASE 1: BÁO CÁO KIỂM TOÁN SOURCE CODE & DATABASE
## HỆ THỐNG USER BEHAVIOR TRACKING & ANALYTICS — AURALIÈ HAUTE COUTURE

**Ngày kiểm toán:** 12/11/2026  
**Phạm vi:** Toàn bộ Frontend, Backend Node.js và Database Microsoft SQL Server (`AURALIE_FashionDB`)  
**Trạng thái:** Chỉ kiểm toán — **Chưa viết code triển khai**

---

## 1. EXISTING SYSTEM & DATABASE ANALYSIS (PHÂN TÍCH HỆ THỐNG & CSDL HIỆN TẠI)

### 1.1 Kiến trúc Frontend thực tế
- **Công nghệ:** **Vite 5.4 + HTML5 + CSS3 + Vanilla JavaScript theo mô hình Multi-Page Application (MPA)** (lưu ý: dự án hiện tại **không sử dụng React SPA**).
- **Danh sách trang (`frontend/`):** 15 trang HTML độc lập (`index.html`, `collections.html`, `cart.html`, `wishlist.html`, `profile.html`, `admin.html`, `login.html`, `blog.html`, `blog-detail.html`, `about.html`, `contact.html`, `privacy-policy.html`, `return-policy.html`, `shipping-policy.html`, `warranty-policy.html`).
- **Tầng JS dùng chung:**
  - `frontend/js/api/client.js`: HTTP client chuẩn hóa (`ApiClient`), tự động đính kèm `Authorization: Bearer <token>` từ `sessionStorage`.
  - `frontend/js/auth.js`: Quản lý phiên đăng nhập (`auralie_token`, `auralie_user` trong `sessionStorage`; metadata `userId`, `userRole`, `userName`, `userEmail` trong `localStorage`).
  - `frontend/js/app.js`: Xử lý catalog, modal xem chi tiết sản phẩm (`openProductModal`), tìm kiếm (`loadCatalogProducts`), giỏ hàng, checkout, wishlist.
- **Lưu trữ Giỏ hàng:** Lưu hoàn toàn phía client tại `localStorage` với key `auralie_cart`.
- **Nhận diện khách vãng lai (Anonymous User):** **Chưa có**. Khách chưa đăng nhập hiện không có `anonymous_id` hay `session_id`; khi đặt hàng (Guest Checkout), cột `orders.user_id` lưu `NULL`.

### 1.2 Kiến trúc Backend thực tế
- **Công nghệ:** Node.js (CommonJS), Express 4, Clean Modular Architecture (`backend/src/modules/`).
- **Các module hiện có:** `auth`, `products`, `categories`, `orders`, `reviews`, `coupons`, `users`, `wishlist`, `blogs`, `inquiries`, `admin`, `ai`.
- **Authentication & Authorization:** `verifyToken` và `requireAdmin` trong `backend/src/middlewares/auth.middleware.js`.
- **Search API hiện có:** `GET /api/v1/products?category=&search=&tag=` (`products.repository.js`), hỗ trợ tìm theo `name`/`description`, lọc theo `category` slug và `tag`, nhưng **chưa ghi nhận log tìm kiếm**.
- **Admin Stats API hiện có:** `GET /api/v1/admin/stats` (`admin.routes.js`), mới chỉ thống kê tổng doanh thu, tổng đơn, tổng sản phẩm, tổng user, tổng review và số sản phẩm theo danh mục.

### 1.3 Phân tích Database SQL Server (`AURALIE_FashionDB`)
Database hiện có **18 bảng** theo `database/sqlserver_setup.sql` (cộng thêm migration `20261105_add_order_items_snapshot.sql` đã bổ sung 4 cột snapshot cho `order_items`):

| Nhóm bảng | Tên bảng | Trạng thái sử dụng thực tế |
|---|---|---|
| **Sản phẩm & Danh mục** | `categories`, `products`, `product_variants`, `product_images` | Đang hoạt động đầy đủ |
| **Người dùng & Quyền** | `roles`, `users` | Đang hoạt động đầy đủ |
| **Đơn hàng & Thanh toán** | `orders`, `order_items`, `coupons`, `payment_transactions`, `inventory_imports` | Đang hoạt động đầy đủ (đã có snapshot trên `order_items`) |
| **Tương tác đã hoạt động** | `wishlists`, `product_reviews` | Đang ghi/đọc thực tế qua API |
| **Nội dung** | `blogs` | Đang hoạt động |
| **Bảng hành vi/AI chưa sử dụng** | `abandoned_carts`, `ai_chat_sessions`, `ai_chat_messages`, `ai_image_embeddings` | **Đã có trong schema nhưng Backend chưa ghi/đọc** (`ai.routes.js` trả về mock trực tiếp, giỏ hàng chưa đồng bộ lên `abandoned_carts`) |

---

## 2. EXISTING BEHAVIOR TRACKING ANALYSIS (PHÂN TÍCH HÀNH VI ĐÃ/CHƯA LƯU)

### 2.1 Hành vi ĐÃ được lưu gián tiếp
1. **Wishlist (`wishlists`):** Lưu `user_id`, `product_id`, `created_at` (chỉ áp dụng cho user đã đăng nhập).
2. **Đánh giá sản phẩm (`product_reviews`):** Lưu `product_id`, `user_name`, `user_email`, `rating`, `comment`, `variant_info`, `created_at`.
3. **Mua hàng (`orders`, `order_items`, `payment_transactions`):** Lưu thông tin đơn hàng, sản phẩm/biến thể đã mua, số tiền, mã giảm giá, trạng thái thanh toán/hủy đơn.

### 2.2 Hành vi CHƯA được lưu
- Toàn bộ hành vi duyệt web (Page View, Duration, Scroll, Navigation, Category View).
- Hành vi tương tác sản phẩm trước khi mua (Product View, Product Click, Image View, Variant Select, Quantity Change, Share).
- Toàn bộ hành vi tìm kiếm (Keyword, Result Count, Search Result Click, No Result, Filter, Sort).
- Hành vi giỏ hàng chi tiết theo thời gian thực (Add to Cart, Remove, Update Quantity, Cart View, và đồng bộ `abandoned_carts`).
- Hành vi phễu Checkout (Checkout Start, Info Submit, Payment Method Select, Coupon Apply/Remove, Checkout Failed).
- Hành vi tài khoản (Login, Register, Logout, Profile Update dưới dạng event stream).
- Hành vi Marketing/UTM (Banner View/Click, Promotion View/Click, UTM Source/Medium/Campaign).
- Quản lý phiên truy cập (`user_sessions`), định danh ẩn danh (`anonymous_id`) và đồng ý thu thập dữ liệu (`tracking_consents`).

### 2.3 API có thể tái sử dụng
- `GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/categories` (lấy metadata sản phẩm/danh mục).
- `POST /api/v1/coupons/apply` (tái sử dụng để phát hiện sự kiện áp dụng coupon).
- `GET /api/v1/wishlist`, `POST /api/v1/wishlist` (tái sử dụng dữ liệu wishlist thay vì lưu trùng danh sách hiện tại; chỉ ghi thêm event `wishlist_add` / `wishlist_remove` vào stream sự kiện để tính funnel/time-series).
- `GET /api/v1/orders/*` (đối soát purchase chính xác từ trạng thái đơn hàng hợp lệ trong DB, không tính đơn `CANCELLED` là doanh thu thành công).

---

## 3. MISSING TRACKING EVENTS (DANH SÁCH SỰ KIỆN CẦN BỔ SUNG)

Chuẩn hóa theo 8 nhóm nghiệp vụ:
1. **Page Tracking:** `page_view`, `page_exit`, `page_duration`, `page_scroll`, `navigation`, `category_view`.
2. **Product Tracking:** `product_view`, `product_click`, `product_image_view`, `product_variant_select`, `product_quantity_change`, `product_compare`, `product_share`.
3. **Search Tracking:** `search`, `search_result_click`, `search_no_result`, `search_filter`, `search_sort`.
4. **Shopping Cart Tracking:** `add_to_cart`, `remove_from_cart`, `update_cart_quantity`, `cart_view`, `cart_abandon` (đồng bộ với bảng `abandoned_carts` đã có).
5. **Wishlist Tracking:** `wishlist_add`, `wishlist_remove`, `wishlist_view`.
6. **Checkout Tracking:** `checkout_start`, `checkout_information_submit`, `shipping_method_select`, `payment_method_select`, `coupon_apply`, `coupon_remove`, `purchase`, `checkout_failed`.
7. **Customer Account Tracking:** `register`, `login`, `logout`, `profile_update` (tuyệt đối không lưu password, token, CVV, số thẻ).
8. **Marketing Tracking:** `banner_view`, `banner_click`, `promotion_view`, `promotion_click`, `coupon_view`.

---

## 4. PROPOSED DATABASE ARCHITECTURE (KIẾN TRÚC CSDL ĐỀ XUẤT)

### Nguyên tắc tái sử dụng & không trùng lặp
- **Tái sử dụng `abandoned_carts`:** Nâng cấp/sử dụng lại bảng `abandoned_carts` hiện có để lưu giỏ hàng bỏ quên (bổ sung `session_id` / `anonymous_id` nếu cần hỗ trợ khách vãng lai).
- **Tái sử dụng `wishlists`, `orders`, `order_items`:** Không nhân bản bảng nghiệp vụ; các bảng tổng hợp ngày (`user_behavior_daily`, `product_daily_metrics`) sẽ kết hợp dữ liệu từ `user_events` và `orders`.

### Các bảng mới cần tạo qua SQL Migration (có script Rollback)
1. **`tracking_consents`**: Lưu trạng thái đồng ý thu thập dữ liệu (`consent_id`, `user_id`, `anonymous_id`, `consent_type`, `consent_status`, `consent_timestamp`, `policy_version`).
2. **`user_sessions`**: Lưu thông tin phiên truy cập (`session_id`, `user_id`, `anonymous_id`, `started_at`, `last_activity_at`, `ended_at`, `landing_page`, `referrer`, `device_type`, `browser`, `operating_system`, `traffic_source`, UTM params).
3. **`user_events`**: Bảng sự kiện chuẩn hóa với `event_id` (`UNIQUE` chống trùng lặp), `event_name` (`CHECK` hoặc validate), `user_id` (FK nullable), `anonymous_id`, `session_id` (FK), `product_id` (FK nullable), `category_id` (FK nullable), `event_timestamp` (UTC `DATETIME2`), `page_url`, `referrer_url`, `device_type`, `browser`, `operating_system`, `event_properties` (`NVARCHAR(MAX)` kiểm tra `ISJSON(event_properties) = 1`), `created_at`.
   - **Index:** Composite index trên `(event_name, event_timestamp)`, `(user_id, event_timestamp)`, `(anonymous_id, event_timestamp)`, `(product_id, event_timestamp)`, `(session_id)`.
4. **`user_search_history`**: Lưu lịch sử tìm kiếm (`search_id`, `user_id`, `anonymous_id`, `session_id`, `keyword`, `result_count`, `clicked_product_id`, `filters_json`, `created_at`).
5. **`product_interactions`**: Lưu tương tác sản phẩm trọng tâm (`interaction_id`, `user_id`, `anonymous_id`, `session_id`, `product_id`, `variant_id`, `interaction_type`, `interaction_value`, `created_at`).
6. **`user_behavior_daily`**: Bảng tổng hợp theo ngày cho khách hàng/anonymous (`behavior_date`, `user_id`, `anonymous_id`, các chỉ số đếm views, searches, cart_adds, wishlist_adds, purchases, orders, spent).
7. **`product_daily_metrics`**: Bảng tổng hợp theo ngày cho sản phẩm (`product_id`, `metric_date`, `total_views`, `unique_viewers`, `total_cart_adds`, `total_wishlist_adds`, `total_orders`, `total_units_sold`, `total_revenue`, `conversion_rate`).

*(Lưu ý kiến trúc Frontend: Do Frontend hiện tại là **Vite + Vanilla JS MPA**, Tracking SDK sẽ được đặt tại `frontend/js/services/tracking/` dưới dạng các module ES/UMD tương thích trực tiếp với cả 15 trang `.html` hiện tại qua `<script>` hoặc Vite bundler, đồng thời giữ đúng cấu trúc `trackingService.js`, `eventTracker.js`, `sessionManager.js`, `identityManager.js`, `consentManager.js`, `eventQueue.js`.)*

---

## 5. IMPLEMENTATION PLAN (KẾ HOẠCH TRIỂN KHAI THEO PHASE)

- **Phase 2 – Database Migration & Rollback:** Tạo migration SQL Server cho 7 bảng tracking + bổ sung `anonymous_id`/`session_id` cho `abandoned_carts` (nếu cần), kèm script rollback và kiểm thử idempotency.
- **Phase 3 – Backend Tracking Ingestion API:** Xây dựng module `backend/src/modules/tracking/` (`POST /api/tracking/events`, `/events/batch`, `/session/start`, `/session/heartbeat`, `/consent`), validation chặt chẽ, chống spam/rate-limit, deduplication qua `event_id`, và liên kết `anonymous_id -> user_id` khi đăng nhập.
- **Phase 4 – Frontend Tracking SDK (Vanilla JS MPA):** Xây dựng bộ `frontend/js/services/tracking/` (Identity, Session, Consent Banner/Manager, Event Queue với batching + retry `localStorage` + `navigator.sendBeacon` khi rời trang), tích hợp vào `app.js`, `auth.js`, `cart.html`, `collections.html`, `wishlist.html`.
- **Phase 5 – Aggregation Jobs & Analytics API:** Xây dựng job tổng hợp ngày (`user_behavior_daily`, `product_daily_metrics`) và các endpoint `/api/admin/analytics/*` (Overview, Product, Customer, Search, Conversion Funnel, Top Products) có `verifyToken + requireAdmin`.
- **Phase 6 – Admin Dashboard UI (`admin.html`):** Bổ sung tab **Customer Behavior Analytics** (Overview, Product Analytics, Search Analytics, Conversion Funnel, Customer Journey) đồng bộ giao diện hiện tại.
- **Phase 7 – ML Dataset Pipeline & Automated Testing:** Xây dựng pipeline trích xuất feature (`sales_1d/7d/30d`, `views_1d/7d/30d`, `view_to_cart_rate`, `product_interest_score`...) chống data leakage theo mốc thời gian + bộ Unit & Integration Tests đầy đủ.

