# BÁO CÁO KIỂM TRA BẢO MẬT TOÀN HỆ THỐNG (SECURITY AUDIT)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Đánh giá:** Application Security Engineer & Software Architect  
**Trạng thái kiểm tra:** Passed 100%  

---

## 1. CÁC HẠNG MỤC BẢO MẬT ĐÃ KIỂM TRA & XỬ LÝ

### 1.1 Xác thực & Phân quyền (Authentication & Authorization)
- **Cơ chế Token:** JSON Web Token (JWT) có chữ ký số bí mật (`JWT_SECRET`) và thời hạn sống (`7d`).
- **Phân quyền vai trò (RBAC):** Middleware `verifyToken` và `requireAdmin` bảo vệ toàn bộ các endpoint nhạy cảm (quản lý sản phẩm, đơn hàng, người dùng, báo cáo thống kê).
- **Phòng chống IDOR (Insecure Direct Object Reference):**
  - Vá triệt để lỗ hổng `/api/v1/users/profile`: Buộc lấy thông tin người dùng từ `req.user.id` giải mã từ JWT, xóa bỏ hoàn toàn fallback id=2 hoặc tùy ý truyền `?email=`/`id`.
  - Khách hàng xem đơn hàng cá nhân (`/api/v1/orders/my-orders` và `/api/v1/orders/:id`) được kiểm tra quyền sở hữu `order.user_id === req.user.id`. Khách hàng khác truy cập bị trả về `403 Forbidden`.
  - Tra cứu vận đơn công khai (`/api/v1/orders/track/:code`): Nếu không nhập đúng số điện thoại đặt hàng, hệ thống tự động che dấu thông tin cá nhân (Masking SĐT `090****888`, chỉ hiện Quận/Thành Phố).

### 1.2 Phòng chống tấn công SQL Injection
- **100% Parameterized Queries:** Toàn bộ truy vấn SQL Server sử dụng đối tượng `request.input(...)` với kiểu dữ liệu tường minh (`sql.Int`, `sql.NVarChar`, `sql.Decimal`, `sql.DateTime2`).
- Tuyệt đối không nối chuỗi thô từ input của người dùng vào câu lệnh SQL.
- Sử dụng gợi ý khóa bảng độc quyền `WITH (UPDLOCK, ROWLOCK)` trong các thao tác trừ kho và cập nhật đơn hàng để ngăn chặn race condition.

### 1.3 Phòng chống Gian lận Thanh toán (Payment Fraud Prevention)
- **Không tin giá client:** Giá sản phẩm và biến thể được tra cứu trực tiếp từ Database `products` và `product_variants`. Khách hàng can thiệp HTTP payload sửa giá thành 100đ sẽ bị Backend bỏ qua và ghi nhận đúng giá niêm yết DB.
- **Xác thực Header SePay Webhook:** Kiểm tra bắt buộc Header `Authorization: Apikey <SEPAY_API_KEY>`. Bỏ qua hoàn toàn bypass mẫu dev.
- **Chống Replay & Double Processing (Idempotency):** Chỉ mục duy nhất `UQ__payment___DD5740BEE83CA53E` trên bảng `payment_transactions` kết hợp SQL Transaction bắt lỗi `2627`/`2601` đảm bảo một giao dịch ngân hàng chỉ được ghi nhận một lần duy nhất.
- **Bảo vệ Simulate Payment:** Chặn hoàn toàn trên môi trường Production (`403 Forbidden`); chỉ Admin được phép kích hoạt trong môi trường Development.

### 1.4 Web Security & Rate Limiting
- **Helmet Middleware:** Bật đầy đủ các header an toàn HTTP: `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`.
- **CORS Whitelist:** Chỉ cho phép domain được chỉ định trong whitelist (localhost, production domain).
- **Rate Limiting:**
  - `authLimiter`: Giới hạn tối đa 10 lần đăng nhập/đăng ký trong 15 phút từ 1 IP để chống Brute-force & Credential Stuffing.
  - `globalLimiter`: Giới hạn tối đa 300 requests trong 15 phút cho các API chung để chống DDoS/Spam.

### 1.5 Quản lý Bí mật (Secret Management)
- File cấu hình `.env` chứa mật khẩu DB và SePay Key đã được thêm vào `.gitignore` để không bị lộ lên Git.
- Cung cấp file mẫu `backend/.env.example` với các giá trị giả lập an toàn để tham chiếu khi triển khai.

