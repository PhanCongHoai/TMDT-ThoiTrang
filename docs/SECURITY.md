# CHÍNH SÁCH BẢO MẬT & KIỂM SOÁT AN NINH — AURALIÈ
**Application Security Engineering Standards**

---

## 1. NGUYÊN TẮC BẢO MẬT CỐT LÕI

Hệ thống được thiết kế tuân thủ tiêu chuẩn an ninh **OWASP Top 10**:

### 1.1 Chống SQL Injection (SQLi)
- Toàn bộ các truy vấn đến Microsoft SQL Server đều thực thi qua **Parameterized Queries** (`request.input(key, value)`).
- Tuyệt đối không nối chuỗi trực tiếp dữ liệu từ `req.body`, `req.query`, hay `req.params` vào các mệnh đề SQL.

### 1.2 Xác thực & Quản lý Phiên (Broken Authentication)
- Mật khẩu người dùng được băm an toàn bằng thuật toán **bcrypt** với Salt Round = 12 trước khi lưu vào database.
- Không lưu trữ mật khẩu dưới dạng văn bản thô (Plaintext) ở bất kỳ đâu trên cả Frontend (đã loại bỏ hoàn toàn `savedUserPassword` trong `localStorage`) và Backend.
- Phiên đăng nhập được quản lý bằng chuẩn **JSON Web Token (JWT)** có chữ ký HMAC-SHA256, thời hạn hết hạn 7 ngày (`JWT_EXPIRES_IN=7d`).
- Token được lưu trữ trong `sessionStorage` của client để giảm thiểu nguy cơ bị đánh cắp so với `localStorage`.

### 1.3 Phân quyền Theo Vai trò (Role-Based Access Control — RBAC)
- Backend áp dụng 2 tầng middleware:
  - `verifyToken`: Kiểm tra tính toàn vẹn và hạn sử dụng của JWT.
  - `requireAdmin`: Kiểm tra `req.user.role === 'ADMIN'`. Bất kỳ yêu cầu nào không có quyền quản trị viên đều bị từ chối với mã lỗi `403 Forbidden`.
- Loại bỏ hoàn toàn lỗ hổng phân quyền chỉ dựa vào `localStorage.getItem('userRole')` phía client.

### 1.4 Chống Tấn công Từ chối Dịch vụ & Brute-force (Rate Limiting)
- Tích hợp `express-rate-limit`:
  - **Global Limiter:** Giới hạn 300 requests / 15 phút cho mỗi địa chỉ IP.
  - **Auth Limiter:** Giới hạn 20 lần thử đăng nhập/đăng ký / 15 phút để bảo vệ endpoint `/api/v1/auth/login`.

### 1.5 Bảo vệ HTTP Headers (Helmet)
- Sử dụng thư viện `helmet` để thiết lập các cờ an ninh chuẩn:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN` (chống Clickjacking)
  - `Strict-Transport-Security (HSTS)`
  - `X-XSS-Protection`

### 1.6 Kiểm soát Chia sẻ Tài nguyên Nguồn gốc chéo (CORS)
- Cấu hình whitelist nghiêm ngặt: chỉ cho phép các origin cục bộ đã đăng ký (`http://localhost:3000`, `http://localhost:5000`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`) hoặc tunnel Cloudflare chỉ định (`*.trycloudflare.com`).
- Không sử dụng wildcard `*` khi kích hoạt `credentials: true`.

### 1.7 Xử lý Lỗi An toàn (Error Handling & Information Disclosure)
- Toàn bộ lỗi được bắt qua `errorHandler` tập trung trong `error.middleware.js`.
- Trong môi trường `production`, hệ thống ẩn toàn bộ chi tiết stack trace và thông báo lỗi database nội bộ để tránh lộ cấu trúc CSDL cho kẻ tấn công.

