# HƯỚNG DẪN CƠ SỞ DỮ LIỆU SQL SERVER - AURALIÈ HAUTE COUTURE

Hệ thống cơ sở dữ liệu đã được khởi tạo và nạp toàn bộ dữ liệu mẫu vào Microsoft SQL Server trên máy cục bộ của bạn.

---

### 1. Thông Tin Kết Nối SQL Server
- **Server Name:** `localhost` hoặc `.` hoặc `(local)`
- **Database Name:** `AURALIE_FashionDB`
- **Authentication:** Windows Authentication (hoặc `sa` nếu đã bật SQL Server Authentication)
- **Collation:** `Vietnamese_CI_AS` (Hỗ trợ tiếng Việt có dấu chuẩn Unicode `N''`)
- **Tập tin script tổng hợp:** [database/sqlserver_setup.sql](file:///c:/Users/ASUS/Documents/Demo/DATN/database/sqlserver_setup.sql)

---

### 2. Danh Sách 18 Bảng Đã Được Tạo & Nạp Dữ Liệu

| STT | Tên Bảng | Ý Nghĩa / Nghiệp Vụ | Số Dòng Mẫu |
|:---:|---|---|:---:|
| 1 | `roles` | Phân quyền người dùng (ADMIN, CUSTOMER) | 2 |
| 2 | `users` | Tài khoản khách hàng & quản trị viên VIP | 5 |
| 3 | `categories` | 5 Danh mục thời trang xa xỉ AURALIÈ | 5 |
| 4 | `products` | Danh mục 20 sản phẩm may đo Haute Couture | 20 |
| 5 | `product_variants` | Biến thể kích cỡ (S/M/L/XL), màu sắc, tồn kho & SKU | 14 |
| 6 | `product_images` | Thư viện hình ảnh sản phẩm góc chụp thực tế | 8 |
| 7 | `orders` | Đơn hàng thực tế (`AUR-2026-992`, `AUR-2026-781`, `AUR-2026-554`...) | 4 |
| 8 | `order_items` | Chi tiết sản phẩm trong từng đơn hàng | 4 |
| 9 | `coupons` | Mã giảm giá VIP (`AURALIE2026`, `WELCOME10`, `VIPPLATINUM`...) | 4 |
| 10 | `product_reviews` | Đánh giá & nhận xét thực tế kèm phản hồi từ Admin | 5 |
| 11 | `wishlists` | Danh sách sản phẩm yêu thích của khách VIP | 4 |
| 12 | `blogs` | Bài viết tạp chí thời trang AURALIÈ Gazette (từ `blog.html`) | 6 |
| 13 | `ai_chat_sessions` | Phiên trò chuyện tư vấn phong cách cùng AI Stylist | 1 |
| 14 | `ai_chat_messages` | Lịch sử trao đổi tin nhắn giữa khách và AI | 2 |
| 15 | `ai_image_embeddings` | Vector đặc trưng AI tìm kiếm bằng hình ảnh | 2 |
| 16 | `abandoned_carts` | Nhắc nhở giỏ hàng bỏ quên & marketing ưu đãi | 1 |
| 17 | `inventory_imports` | Nhật ký nhập kho hàng loạt từ đối tác Ý & Việt Nam | 3 |
| 18 | `payment_transactions` | Giao dịch thanh toán cổng VNPAY QR, VISA, COD | 3 |

---

### 3. Cách Mở & Xem Trên SQL Server Management Studio (SSMS)
1. Mở **SQL Server Management Studio (SSMS)**.
2. Tại màn hình Connect to Server:
   - **Server type:** Database Engine
   - **Server name:** `localhost`
   - **Authentication:** Windows Authentication
3. Nhấn **Connect**.
4. Mở rộng cây thư mục: `Databases` ➔ `AURALIE_FashionDB` ➔ `Tables`.
5. Nhấp chuột phải vào bất kỳ bảng nào (ví dụ `products` hoặc `orders`) ➔ Chọn **Select Top 1000 Rows** để xem dữ liệu.

---

### 4. Lệnh Chạy Lại Script (Nếu Muốn Reset CSDL)
Mở PowerShell tại thư mục gốc dự án và chạy lệnh sau:
```powershell
sqlcmd -S localhost -E -i "database\sqlserver_setup.sql" -f 65001
```
