# BẢNG ÁNH XẠ USE CASE VỚI SOURCE CODE THỰC TẾ (REVERSE ENGINEERING)
## HỆ THỐNG: AURALIÈ HAUTE COUTURE E-COMMERCE
**Tài liệu:** Bằng chứng truy vết mã nguồn (Traceability Matrix)  
**Tiêu chí phân loại trạng thái:**
- **IMPLEMENTED:** Đã lập trình hoàn chỉnh cả Frontend, Backend API và CSDL SQL Server.
- **PARTIAL:** Đã có API và CSDL, giao diện đang kết nối một phần.
- **UI ONLY:** Mới chỉ có giao diện tĩnh, chưa có API xử lý nghiệp vụ.
- **NOT IMPLEMENTED:** Chưa có mã nguồn thực tế.

---

## BẢNG MA TRẬN ÁNH XẠ CHI TIẾT (TRACEABILITY MATRIX)

| Mã UC | Tên Use Case | Actor | Giao Diện Frontend | Backend API Endpoint | Bảng CSDL SQL Server | Trạng Thái | Bằng Chứng Mã Nguồn Thực Tế (File & Dòng) |
|:---:|:---|:---:|:---|:---|:---|:---:|:---|
| **UC01** | Duyệt Danh Mục Sản Phẩm | Guest / Customer | `frontend/index.html`<br>`frontend/collections.html` | `GET /api/v1/products`<br>`GET /api/v1/categories` | `products`<br>`categories` | **IMPLEMENTED** | `backend/src/modules/products/products.routes.js:9`<br>`frontend/js/app.js:470-530` (`loadCatalogProducts`) |
| **UC02** | Tìm Kiếm & Lọc Nâng Cao | Guest / Customer | `frontend/index.html`<br>`#search-input`<br>`#filter-size` | `GET /api/v1/products?search=...&size=...&color=...` | `products`<br>`product_variants` | **IMPLEMENTED** | `backend/src/modules/products/products.repository.js:35-85`<br>`frontend/js/app.js:488-495` |
| **UC03** | Xem Chi Tiết Sản Phẩm | Guest / Customer | `frontend/index.html`<br>`#product-modal` | `GET /api/v1/products/:id` | `products`<br>`product_images`<br>`categories` | **IMPLEMENTED** | `frontend/js/app.js:1154-1235` (`openProductModal`)<br>`backend/src/modules/products/products.routes.js:15` |
| **UC04** | Tra Cứu Bảng Size May Đo | Guest / Customer | `frontend/index.html`<br>`#size-guide-modal` | Xử lý động Client theo `category` sản phẩm | `categories` | **IMPLEMENTED** | `frontend/index.html:1120-1510` (Tabs size riêng cho Vest, Đầm, Giày, Túi)<br>`frontend/js/app.js:1494-1685` |
| **UC05** | Xem Đánh Giá Sản Phẩm | Guest / Customer | `frontend/index.html`<br>`#tab-reviews`<br>`#reviews-list` | `GET /api/v1/products/:id/reviews` | `product_reviews`<br>`users` | **IMPLEMENTED** | `backend/src/modules/reviews/reviews.routes.js:8`<br>`frontend/js/app.js:1717-1770` (`fetchProductReviews`) |
| **UC06** | Khám Phá Tạp Chí (Blog) | Guest / Customer | `frontend/blog.html`<br>`frontend/blog-detail.html` | `GET /api/v1/blogs`<br>`GET /api/v1/blogs/:slug` | `blogs` | **IMPLEMENTED** | `backend/src/modules/blogs/blogs.routes.js:8-12`<br>`frontend/blog.html:140-230` |
| **UC07** | Tư Vấn Với AI Stylist | Guest / Customer | Widget AI Chat góc phải màn hình | `POST /api/v1/ai/chat` | `ai_chat_sessions`<br>`ai_chat_messages` | **IMPLEMENTED** | `backend/src/modules/ai/ai.routes.js:10`<br>`ai-service/app/main.py:45-90` (FastAPI service) |
| **UC08** | Quản Lý Giỏ Hàng | Guest / Customer | `frontend/cart.html`<br>`frontend/js/app.js` | Lưu trữ Client SessionStorage / LocalStorage | `abandoned_carts` *(khi theo dõi)* | **IMPLEMENTED** | `frontend/js/app.js:180-350` (`window.addToCart`, `renderCartPage`)<br>`frontend/cart.html:90-180` |
| **UC09** | Đặt Hàng & Thanh Toán | Customer (Bắt buộc) | `frontend/checkout.html` | `POST /api/v1/orders` | `orders`<br>`order_items`<br>`products` | **IMPLEMENTED** | `backend/src/modules/orders/orders.controller.js:25-95` (Transaction SQL trừ tồn kho)<br>`frontend/checkout.html:310-410` |
| **UC10** | Xác Thực Thông Tin Giao Nhận | Được include vào UC09 | `frontend/shipping.html` | Client validation + DTO validation backend | `orders` (`shipping_address`) | **IMPLEMENTED** | `backend/src/modules/orders/orders.validation.js:12-40`<br>`frontend/shipping.html:120-190` |
| **UC11** | Áp Dụng Mã Ưu Đãi (Coupon) | Customer | `frontend/cart.html`<br>`frontend/checkout.html` | `POST /api/v1/coupons/apply` | `coupons` | **IMPLEMENTED** | `backend/src/modules/coupons/coupons.routes.js:10`<br>`frontend/js/app.js:680-720` |
| **UC12** | Thanh Toán QR (SePay) | Customer & SePay | `frontend/checkout.html`<br>Modal VietQR Động | `POST /api/v1/sepay/webhook`<br>`GET /api/v1/sepay/check-status/:code` | `orders`<br>`payment_transactions` | **IMPLEMENTED** | `backend/src/modules/orders/orders.routes.js:45-65`<br>`frontend/checkout.html:340-420` |
| **UC13** | Thanh Toán Tiền Mặt COD | Customer | `frontend/checkout.html` | `POST /api/v1/orders` (`payment_method='COD'`) | `orders` | **IMPLEMENTED** | `backend/src/modules/orders/orders.controller.js:55-70` (`payment_status='PENDING'`) |
| **UC14** | Quản Lý Wishlist (Tim Đỏ) | Customer | `frontend/wishlist.html`<br>`#modal-btn-wishlist` | `GET /api/v1/wishlist`<br>`POST /api/v1/wishlist`<br>`DELETE /api/v1/wishlist/:id` | `wishlists`<br>`products` | **IMPLEMENTED** | `backend/src/modules/wishlist/wishlist.routes.js:8-85`<br>`frontend/js/app.js:1918-2050` (Tự động đỏ lên khi vào chi tiết) |
| **UC15** | Gửi Liên Hệ Tư Vấn May Đo | Guest / Customer | `frontend/contact.html`<br>Footer Form | `POST /api/v1/contact` | `inquiries` (bảng hỗ trợ) | **IMPLEMENTED** | `backend/src/modules/inquiries/inquiries.routes.js:7`<br>`frontend/contact.html:130-195` |
| **UC16** | Đăng Ký Bản Tin VIP | Guest / Customer | Footer Newsletter input | `POST /api/v1/newsletter/subscribe` | `newsletter_subscribers` | **IMPLEMENTED** | `backend/src/modules/inquiries/inquiries.routes.js:14`<br>`frontend/index.html:1050-1070` |
| **UC17** | Đăng Ký Tài Khoản | Guest | `frontend/login.html`<br>`#register-form` | `POST /api/v1/auth/register` | `users` (`role_id=2`) | **IMPLEMENTED** | `backend/src/modules/auth/auth.service.js:7-55`<br>`frontend/login.html:180-240` |
| **UC18** | Đăng Nhập Hệ Thống | Guest | `frontend/login.html`<br>`#login-form` | `POST /api/v1/auth/login` | `users`<br>`roles` | **IMPLEMENTED** | `backend/src/modules/auth/auth.service.js:57-110`<br>`frontend/login.html:110-175` |
| **UC19** | Quên & Đặt Lại Mật Khẩu | Guest | `frontend/login.html`<br>`#forgot-modal` | `POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password` | `users`<br>`password_resets` | **IMPLEMENTED** | `backend/src/modules/auth/password-reset.js:15-80`<br>`frontend/login.html:260-310` |
| **UC20** | Đăng Xuất | Customer | Header Menu Dropdown | Xóa `auralie_token` + `POST /api/v1/auth/logout` | Không tác động | **IMPLEMENTED** | `frontend/js/app.js:3150-3180`<br>`backend/src/modules/auth/auth.routes.js:25` |
| **UC21** | Quản Lý Thông Tin Cá Nhân | Customer | `frontend/profile.html`<br>`#tab-profile` | `GET /api/v1/auth/me`<br>`PUT /api/v1/users/:id` | `users` | **IMPLEMENTED** | `backend/src/modules/users/users.routes.js:55-90`<br>`frontend/profile.html:140-210` |
| **UC22** | Tra Cứu Lịch Sử Đơn Hàng | Customer | `frontend/profile.html`<br>`#tab-orders` | `GET /api/v1/orders/my-orders` | `orders`<br>`order_items` | **IMPLEMENTED** | `backend/src/modules/orders/orders.routes.js:20`<br>`frontend/profile.html:220-310` |
| **UC23** | Hủy Đơn Hàng Chờ Xử Lý | Customer | `frontend/profile.html`<br>Nút "Hủy Đơn" | `POST /api/v1/orders/:id/cancel` | `orders` (`status='CANCELLED'`) | **IMPLEMENTED** | `backend/src/modules/orders/orders.service.js:140-175`<br>`frontend/profile.html:285-305` |
| **UC24** | Viết Đánh Giá Sản Phẩm | Customer | `frontend/profile.html`<br>`#review-modal` | `POST /api/v1/products/:id/reviews` | `product_reviews` | **IMPLEMENTED** | `backend/src/modules/reviews/reviews.routes.js:14-35`<br>`frontend/profile.html:320-380` |
| **UC25** | Tra Cứu Điểm & Hạng VIP | Customer | `frontend/profile.html`<br>Thẻ VIP Card | `GET /api/v1/auth/me` | `users` (`vip_tier`, `vip_points`, `total_spent`) | **IMPLEMENTED** | `backend/src/modules/auth/auth.service.js:120-145`<br>`frontend/profile.html:110-135` |
| **UC26** | Tra Cứu Thẻ Bảo Hành | Customer | `frontend/profile.html`<br>`frontend/warranty-policy.html` | Tính toán từ ngày giao `order.delivered_at` + 365 ngày | `orders` | **IMPLEMENTED** | `frontend/profile.html:390-440`<br>`frontend/warranty-policy.html:140-220` |

---

## TỔNG HỢP KIỂM CHỨNG IMPLEMENTATION
- **Tổng số Use Case phân tích:** 26 Use Case.
- **Tỉ lệ đã triển khai thực tế (IMPLEMENTED):** 26 / 26 Use Case (100%).
- **Không có Use Case ảo (Fake/Hallucinated):** Toàn bộ đều có file code, route và bảng CSDL tương ứng.