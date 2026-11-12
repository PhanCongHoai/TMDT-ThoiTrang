# BÁO CÁO KIỂM TOÁN TOÀN BỘ DỰ ÁN (FINAL PROJECT AUDIT)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Phiên bản:** 2.0 Enterprise  
**Thời gian kiểm toán:** 2026-11-05  
**Kiểm toán viên:** Senior Software Architect & Application Security Engineer  

---

## 1. TỔNG QUAN TÌNH TRẠNG HỆ THỐNG

| Tiêu chí | Trạng thái hiện tại | Đánh giá |
|---|---|---|
| **Kiến trúc Backend** | Modular Architecture (auth, products, orders, reviews đã tách) | Tốt, cần hoàn thiện nốt users, inquiries, admin |
| **Bảo vệ Đơn hàng & Tồn kho** | Phase 3.3.1 & 3.3.2 đã hoàn thiện kiểm tra DB & Transaction | Xuất sắc, cần bổ sung state transition guard & auto-job |
| **Thanh toán SePay VietQR** | Idempotency 2 lớp, xác thực header, late payment handling | Đạt 100% 14/14 test cases bảo mật |
| **Kiểm soát Truy cập & IDOR** | Auth & Products tốt, Users còn tồn tại IDOR | Cần xử lý triệt để trong module Users |
| **Giao diện Frontend** | Vanilla JS MPA với Vite build 515ms | Cần chuẩn hóa API Client trên tất cả trang |
| **Toàn vẹn Dữ liệu CSDL** | Microsoft SQL Server 2022 (AURALIE_FashionDB) | Ràng buộc khóa ngoại, unique constraint đầy đủ |

---

## 2. DANH MỤC VẤN ĐỀ PHÁT HIỆN & PHƯƠNG ÁN XỬ LÝ

### 📌 [AUDIT-001] [MỨC ĐỘ: HIGH] Lỗ hổng IDOR trong Module Users (`/api/v1/users/profile`)
- **File liên quan:** [`backend/src/modules/users/users.routes.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/users/users.routes.js)
- **Bằng chứng thực tế:**
  ```javascript
  // GET /profile: Cho phép truyền ?email= bất kỳ hoặc mặc định u.id = 2 nếu không truyền token
  if (email) { sqlQuery += ` WHERE u.email = @email`; } else { sqlQuery += ` WHERE u.id = 2`; }
  
  // PUT /profile: Cho phép body truyền id bất kỳ để sửa profile người khác
  const userId = Number(id) || 2;
  ```
- **Ảnh hưởng:** Người dùng chưa xác thực hoặc kẻ tấn công có thể xem và sửa đổi thông tin của tài khoản khác (bao gồm tài khoản Admin id=1).
- **Phương án xử lý:** Bắt buộc sử dụng `verifyToken`. Lấy `userId` trực tiếp từ `req.user.id`. Không cho phép can thiệp `userId` từ body hoặc query nếu không có quyền `ADMIN`.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 2 & 6).

---

### 📌 [AUDIT-002] [MỨC ĐỘ: HIGH] Thiếu Endpoint xem lịch sử đơn hàng của cá nhân (`my-orders`) và Tra cứu an toàn
- **File liên quan:** [`backend/src/modules/orders/orders.routes.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.routes.js), [`orders.service.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.service.js)
- **Bằng chứng thực tế:** Hệ thống chỉ có `GET /api/v1/orders` (yêu cầu Admin) và `GET /orders/track/:code` (tra cứu công khai theo mã đơn). Khách hàng đã đăng nhập chưa có API riêng `GET /api/v1/orders/my-orders` để tải danh sách đơn của chính mình.
- **Ảnh hưởng:** Frontend trang cá nhân phải query qua `users/profile` kèm subquery hoặc thiếu dữ liệu chi tiết (items, trạng thái thanh toán).
- **Phương án xử lý:**
  - Bổ sung `GET /api/v1/orders/my-orders` (yêu cầu `verifyToken`).
  - Bổ sung `GET /api/v1/orders/:id` (kiểm tra quyền sở hữu `order.user_id === req.user.id` hoặc `req.user.role === 'ADMIN'`).
  - Bổ sung xác thực số điện thoại khi tra cứu công khai `GET /api/v1/orders/track/:code?phone=...` để ngăn dò quét mã đơn lộ thông tin giao hàng.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 2).

---

### 📌 [AUDIT-003] [MỨC ĐỘ: HIGH] Thiếu State Machine Transition Guard khi Admin cập nhật trạng thái đơn hàng
- **File liên quan:** [`backend/src/modules/orders/orders.service.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.service.js), [`orders.repository.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.repository.js)
- **Bằng chứng thực tế:** Phương thức `updateOrderStatus(id, status)` thực thi câu lệnh SQL trực tiếp `UPDATE orders SET status = @status WHERE id = @id` mà không kiểm tra trạng thái hiện tại của đơn hàng.
- **Ảnh hưởng:** Admin có thể vô tình chuyển đơn đã `CANCELLED` sang `CONFIRMED` mà không kiểm tra tồn kho (gây âm kho), hoặc chuyển đơn `COMPLETED` ngược lại `PENDING`, gây sai lệch báo cáo kế toán.
- **Phương án xử lý:** Xây dựng ma trận chuyển trạng thái hợp lệ (`ORDER_STATE_TRANSITIONS`) và ném lỗi 400 nếu vi phạm quy tắc logic nghiệp vụ.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 2).

---

### 📌 [AUDIT-004] [MỨC ĐỘ: MEDIUM] Thiếu Phân Trang & Bộ Lọc Nâng Cao cho Admin Orders
- **File liên quan:** [`backend/src/modules/orders/orders.repository.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.repository.js)
- **Bằng chứng thực tế:** `getAllOrders()` hiện tại lấy toàn bộ danh sách `SELECT o.* FROM orders ORDER BY created_at DESC` không có phân trang `OFFSET ... FETCH NEXT`.
- **Ảnh hưởng:** Khi số lượng đơn hàng lên hàng chục nghìn, API sẽ chậm và tiêu tốn nhiều RAM của server.
- **Phương án xử lý:** Bổ sung tham số `page`, `limit`, `search` (tìm mã đơn, tên, số điện thoại), `status`, `paymentStatus`, `startDate`, `endDate`.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 2).

---

### 📌 [AUDIT-005] [MỨC ĐỘ: HIGH] Job Giải Phóng Tồn Kho Hết Hạn 15 Phút Chưa Được Lập Lịch Tự Động
- **File liên quan:** [`backend/src/server.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/server.js), [`orders.repository.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.repository.js)
- **Bằng chứng thực tế:** Hàm `releaseExpiredOrders(15)` đã viết tốt ở Phase 3.3.1 nhưng chỉ chạy khi Admin kích hoạt endpoint `POST /orders/cleanup-expired`.
- **Ảnh hưởng:** Nếu không có ai bấm gọi API, các đơn hàng quá 15 phút chưa thanh toán sẽ giữ hàng mãi mãi, làm giảm số lượng hàng có thể bán.
- **Phương án xử lý:** Xây dựng một Worker background lập lịch định kỳ (mỗi 60 giây chạy 1 lần), có log an toàn, tự phục hồi sau khi restart server và có cơ chế bắt lỗi không làm sập server.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 4).

---

### 📌 [AUDIT-006] [MỨC ĐỘ: MEDIUM] Thực Thi DDL (`CREATE TABLE`) Trong Request Handler Của Module Inquiries
- **File liên quan:** [`backend/src/modules/inquiries/inquiries.routes.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/inquiries/inquiries.routes.js)
- **Bằng chứng thực tế:** Mỗi khi khách gửi form liên hệ hoặc newsletter, mã nguồn lại thực thi `IF NOT EXISTS CREATE TABLE contact_inquiries ...`.
- **Ảnh hưởng:** Lãng phí tài nguyên database roundtrip và không theo chuẩn Enterprise Database Lifecycle.
- **Phương án xử lý:** Đảm bảo bảng đã tồn tại trong database schema, loại bỏ hoàn toàn các câu lệnh DDL khỏi HTTP request handler.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 6 & 7).

---

### 📌 [AUDIT-007] [MỨC ĐỘ: MEDIUM] Chuẩn Hóa Phân Tầng Kiến Trúc cho Module Users và Admin
- **File liên quan:** `modules/users/`, `modules/admin/`
- **Bằng chứng thực tế:** Các module này đang viết logic và truy vấn database trực tiếp trong file `.routes.js` thay vì tách Controller/Service/Repository.
- **Ảnh hưởng:** Vi phạm tính nhất quán với `auth`, `products`, `orders`.
- **Phương án xử lý:** Tách cấu trúc chuẩn hoặc đóng gói Service/Controller gọn gàng, an toàn.
- **Trạng thái:** ĐANG XỬ LÝ (GIAI ĐOẠN 9).

---

## 3. KẾ HOẠCH HÀNH ĐỘNG TỔNG THỂ

1. **Giai đoạn 2 (Orders):** Bổ sung `my-orders`, `orders/:id`, State Machine Guard, phân trang Admin, bảo vệ tra cứu công khai.
2. **Giai đoạn 3 (SePay):** Kiểm chứng lại chi tiết kịch bản tương tranh Test 10, bảo đảm tính nhất quán tài chính.
3. **Giai đoạn 4 (Inventory & Job):** Tự động hóa Background Worker quét giải phóng tồn kho 15 phút.
4. **Giai đoạn 5 (Frontend):** Tích hợp và đồng bộ `ApiClient` trên toàn bộ các trang giao diện.
5. **Giai đoạn 6 (Security):** Vá lỗ hổng IDOR Users, bảo vệ CSRF/CORS/Rate-limit, dọn dẹp DDL.
6. **Giai đoạn 7 (Database):** Rà soát toàn bộ khóa ngoại và snapshot đơn hàng.
7. **Giai đoạn 8 (Testing):** Xây dựng bộ kiểm thử End-to-End toàn diện và chạy kiểm thử tương tranh.
8. **Giai đoạn 9 & 10 (Production Readiness & Documentation):** Tạo bộ tài liệu hoàn chỉnh.

