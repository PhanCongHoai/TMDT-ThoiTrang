# NHẬT KÝ THAY ĐỔI HỆ THỐNG (CHANGELOG)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  

---

## [Phiên bản 2.0.0 Enterprise] - 2026-11-05

### 🚀 Tính Năng Mới & Nâng Cấp Kiến Trúc (Architecture & Features)
- **Modularization:** Chuyển đổi toàn bộ monolithic backend (hơn 1.300 dòng code gộp trong server.js) sang kiến trúc Clean Modular Architecture:
  - Tách các module độc lập: `auth`, `products`, `orders`, `reviews`, `coupons`, `users`, `wishlist`, `inquiries`, `admin`, `ai`.
  - Phân tách rõ ràng: Route -> Validation -> Controller -> Service -> Repository.
- **Backend Pricing Calculation:** Loại bỏ hoàn toàn sự tin tưởng vào giá do client gửi; hệ thống tự động tính toán tổng tiền, chiết khấu và thuế từ cơ sở dữ liệu `products` và `product_variants`.
- **Atomic Inventory Reservation:** Trừ kho nguyên tử với khóa độc quyền `UPDLOCK, ROWLOCK` trong SQL Server Transaction; tự động rollback khi số lượng tồn kho không đủ.
- **Order State Machine Guard:** Triển khai ma trận kiểm soát chuyển đổi trạng thái đơn hàng (`orders.state-machine.js`), ngăn chặn các hành vi chuyển trạng thái trái phép.
- **Automated Expired Orders Cleanup Job:** Xây dựng background worker (`expiredOrders.job.js`) tự động chạy mỗi 60 giây để quét và hủy đơn SePay quá 15 phút chưa thanh toán, tự động hoàn trả tồn kho về kệ hàng.
- **Customer Order Management:** Bổ sung endpoint `GET /api/v1/orders/my-orders`, `GET /api/v1/orders/:id`, cho phép khách hàng hủy đơn khi đang ở trạng thái `PENDING` hoặc `CONFIRMED`.
- **Admin Orders Advanced Management:** Bổ sung phân trang `page`, `limit`, tìm kiếm mã đơn/SĐT/tên khách và lọc trạng thái theo thời gian.

### 🛡️ Bảo Mật & Toàn Vẹn Dữ Liệu (Security & Data Integrity)
- **Khắc phục Lỗ hổng IDOR:**
  - Sửa lỗi `/api/v1/users/profile`: Buộc xác thực token JWT, loại bỏ fallback `userId = 2`.
  - Kiểm tra quyền sở hữu đơn hàng trong `/api/v1/orders/:id` và `/api/v1/orders/:id/cancel`.
  - Masking thông tin cá nhân trong tra cứu vận chuyển công khai nếu chưa nhập đúng số điện thoại đặt hàng.
- **SePay Webhook Idempotency:** Bảo vệ bằng 2 lớp (tra cứu trước và bắt lỗi khóa duy nhất SQL Server `2627`/`2601`).
- **Late Payment Handling:** Khi tiền về muộn đối với đơn đã bị hủy hết hạn, hệ thống ghi nhận giao dịch `LATE_PAYMENT` để đối soát kế toán, tuyệt đối không hồi sinh đơn gây âm kho.
- **Amount Validation:** Xử lý toàn diện trường hợp chuyển thiếu (`PARTIALLY_PAID`), chuyển đúng (`PAID`) và chuyển thừa (`PAID` kèm `overpaidAmount`).
- **Simulate Payment Lockdown:** Vô hiệu hóa hoàn toàn endpoint `/api/v1/sepay/simulate-payment` trên môi trường Production; yêu cầu quyền Admin trong môi trường Development.
- **SQL Security:** 100% Parameterized queries trên toàn hệ thống.

### 💻 Giao Diện Người Dùng (Frontend Enhancements)
- Tích hợp lớp `ApiClient` (`frontend/js/api/client.js`) tự động đính kèm Bearer token và xử lý lỗi phiên làm việc 401.
- Nâng cấp màn hình `profile.html` hiển thị đơn hàng động, bổ sung nút Hủy Đơn Hàng cho khách và tra cứu vận đơn an toàn.
- Nâng cấp `admin.html` kết nối API thực tế, tương thích với kết quả phân trang và bảng dữ liệu SQL Server.
- Cải tiến popup VietQR SePay và kiểm tra thanh toán thời gian thực.
- Tối ưu hóa build Vite hoàn tất trong ~380ms.

---

## [Phiên bản 1.0.0] - 2026-10-21
- Khởi tạo dự án ban đầu với giao diện Haute Couture tĩnh và server monolith cơ bản.

