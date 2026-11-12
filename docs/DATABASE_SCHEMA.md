# TÀI LIỆU CẤU TRÚC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
**Database Engine:** Microsoft SQL Server 2022  
**Tên Database:** `AURALIE_FashionDB`  
**Collation:** SQL_Latin1_General_CP1_CI_AS / Vietnamese Unicode hỗ trợ `NVARCHAR`  

---

## 1. DANH SÁCH BẢNG CSDL CHÍNH

### 1.1 Bảng `users` (Người dùng & Khách hàng)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `role_id` | `INT` | NO | Khóa ngoại tới `roles(id)` (1: ADMIN, 2: CUSTOMER) |
| `email` | `NVARCHAR(150)` | NO | UNIQUE, địa chỉ email đăng nhập |
| `password_hash` | `NVARCHAR(255)` | NO | Chuỗi mật khẩu băm bcrypt (salt 12) |
| `full_name` | `NVARCHAR(100)` | NO | Họ tên người dùng |
| `phone` | `NVARCHAR(20)` | YES | Số điện thoại liên lạc |
| `address` | `NVARCHAR(MAX)` | YES | Địa chỉ giao hàng mặc định |
| `vip_tier` | `NVARCHAR(30)` | YES | Hạng VIP: SILVER, GOLD, PLATINUM, DIAMOND |
| `vip_points` | `INT` | YES | Điểm thưởng tích lũy (Default: 0) |
| `total_spent` | `DECIMAL(18,2)` | YES | Tổng chi tiêu tích lũy (Default: 0) |
| `created_at` | `DATETIME2` | YES | Thời gian tạo tài khoản |

### 1.2 Bảng `products` (Sản phẩm thời trang Haute Couture)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `name` | `NVARCHAR(200)` | NO | Tên sản phẩm |
| `slug` | `NVARCHAR(200)` | NO | Đường dẫn tĩnh (Slug URL) |
| `description` | `NVARCHAR(MAX)` | YES | Mô tả chi tiết kiểu dáng & chế tác |
| `base_price` | `DECIMAL(18,2)` | NO | Giá gốc niêm yết |
| `category_id` | `INT` | YES | Khóa ngoại tới `categories(id)` |
| `tag` | `NVARCHAR(50)` | YES | Nhãn sản phẩm (NEW, BESTSELLER, RUNWAY) |
| `material` | `NVARCHAR(150)` | YES | Chất liệu (Lụa tơ tằm, Dạ Cashmere, Len Ý) |
| `fit` | `NVARCHAR(100)` | YES | Form dáng (Tailored Fit, Slim Fit, Relaxed) |
| `lining` | `NVARCHAR(150)` | YES | Lớp lót |
| `hardware` | `NVARCHAR(150)` | YES | Chi tiết phụ kiện (Mạ vàng 18K, Khuy sừng) |
| `origin` | `NVARCHAR(150)` | YES | Xuất xứ (Milano, Paris, Made in Vietnam) |
| `is_active` | `BIT` | YES | Trạng thái hiển thị (1: Đang bán, 0: Ẩn) |
| `created_at` | `DATETIME2` | YES | Thời điểm tạo |

### 1.3 Bảng `product_variants` (Biến thể Kích thước & Màu sắc)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `product_id` | `INT` | NO | Khóa ngoại tới `products(id)` |
| `size` | `NVARCHAR(20)` | NO | Kích cỡ: S, M, L, XL, FreeSize |
| `color` | `NVARCHAR(100)` | NO | Màu sắc thời trang (Đen Tuyền, Vàng Hoàng Gia) |
| `stock_quantity` | `INT` | YES | Số lượng tồn kho sẵn có trong kho (>= 0) |
| `variant_price` | `DECIMAL(18,2)` | YES | Giá bán riêng theo biến thể |
| `sku` | `NVARCHAR(50)` | YES | Mã nhận diện sản phẩm SKU |

### 1.4 Bảng `orders` (Đơn đặt hàng)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `user_id` | `INT` | YES | Khóa ngoại tới `users(id)` (NULL cho Guest Checkout) |
| `order_code` | `NVARCHAR(50)` | NO | UNIQUE, mã đơn hàng chuẩn (AUR-YYYYMMDD-XXXXXX) |
| `total_amount` | `DECIMAL(18,2)` | NO | Tổng số tiền thanh toán (do Backend tính từ DB) |
| `discount_amount` | `DECIMAL(18,2)`| YES | Số tiền chiết khấu giảm giá |
| `shipping_fee` | `DECIMAL(18,2)`| YES | Phí vận chuyển (Default: 0) |
| `shipping_address`| `NVARCHAR(MAX)`| NO | Địa chỉ người nhận hàng |
| `phone_number` | `NVARCHAR(20)` | NO | Số điện thoại người nhận hàng |
| `payment_method` | `NVARCHAR(30)` | YES | COD, VISA, SEPAY_QR |
| `payment_status` | `NVARCHAR(30)` | YES | UNPAID, PARTIALLY_PAID, PAID, REFUNDED |
| `tracking_code` | `NVARCHAR(50)` | YES | Mã vận đơn GHN Express |
| `status` | `NVARCHAR(30)` | YES | PENDING, CONFIRMED, PROCESSING, SHIPPED, COMPLETED, CANCELLED |
| `created_at` | `DATETIME2` | YES | Thời gian tạo đơn hàng |

### 1.5 Bảng `order_items` (Chi tiết mặt hàng trong đơn)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `order_id` | `INT` | NO | Khóa ngoại tới `orders(id)` ON DELETE CASCADE |
| `variant_id` | `INT` | YES | Khóa ngoại tới `product_variants(id)` |
| `quantity` | `INT` | NO | Số lượng đặt mua |
| `price` | `DECIMAL(18,2)` | NO | Snapshot giá gốc tại thời điểm đặt hàng |

### 1.6 Bảng `payment_transactions` (Lịch sử giao dịch thanh toán)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `transaction_code`| `NVARCHAR(64)` | NO | **UNIQUE CONSTRAINT (`UQ__payment___DD5740BEE83CA53E`)** |
| `order_id` | `INT` | NO | Khóa ngoại tới `orders(id)` |
| `payment_method` | `NVARCHAR(30)` | NO | SEPAY_QR, VISA, VNPAY_QR |
| `amount` | `DECIMAL(18,2)` | NO | Số tiền giao dịch thực tế vào tài khoản |
| `gateway_response_code` | `NVARCHAR(20)` | YES | Mã phản hồi cổng (00: Thành công) |
| `status` | `NVARCHAR(30)` | YES | SUCCESS, PARTIALLY_PAID, LATE_PAYMENT, OVERPAYMENT |
| `paid_at` | `DATETIME2` | YES | Thời điểm ghi nhận giao dịch |

### 1.7 Bảng `coupons` (Mã ưu đãi giảm giá)
| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô tả / Ràng buộc |
|---|---|:---:|---|
| `id` | `INT IDENTITY(1,1)` | NO | Khóa chính (Primary Key) |
| `code` | `NVARCHAR(50)` | NO | UNIQUE, mã code nhập (AURALIE2026) |
| `discount_type` | `NVARCHAR(20)` | NO | PERCENT (%) hoặc FIXED (VNĐ) |
| `discount_value` | `DECIMAL(18,2)`| NO | Giá trị giảm giá |
| `min_order_amount`| `DECIMAL(18,2)`| YES | Giá trị đơn hàng tối thiểu |
| `max_discount_amount`| `DECIMAL(18,2)`| YES| Số tiền giảm tối đa đối với loại PERCENT |
| `usage_limit` | `INT` | YES | Tổng số lượt dùng tối đa |
| `used_count` | `INT` | YES | Số lượt đã sử dụng thực tế (tăng nguyên tử) |
| `expiry_date` | `DATETIME2` | YES | Ngày hết hạn |
| `is_active` | `BIT` | YES | 1: Đang kích hoạt, 0: Vô hiệu |

---

## 2. QUAN HỆ KHÓA NGOẠI (FOREIGN KEYS INTEGRITY)
- `users.role_id` -> `roles.id`
- `products.category_id` -> `categories.id`
- `product_variants.product_id` -> `products.id` (ON DELETE CASCADE)
- `orders.user_id` -> `users.id`
- `order_items.order_id` -> `orders.id` (ON DELETE CASCADE)
- `order_items.variant_id` -> `product_variants.id`
- `payment_transactions.order_id` -> `orders.id`
- `product_reviews.product_id` -> `products.id`
- `product_reviews.user_id` -> `users.id`
- `wishlists.user_id` -> `users.id`
- `wishlists.product_id` -> `products.id`

