# DANH SÁCH VẤN ĐỀ ĐÃ BIẾT & LƯU Ý VẬN HÀNH (KNOWN ISSUES & OPERATIONAL NOTES)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Phiên bản:** 1.0.0 (Enterprise Release Candidate)  
**Ngày kiểm toán:** 05/11/2026  

---

## 1. PHÂN LOẠI & TỔNG QUAN

Tất cả các lỗi nghiêm trọng (CRITICAL) và lỗi rủi ro cao (HIGH) đã được xử lý triệt để trong mã nguồn. Dưới đây là các lưu ý kỹ thuật (MEDIUM / LOW / INFORMATIONAL) cần người quản trị và đội ngũ DevOps lưu ý khi vận hành thực tế trên môi trường Production.

---

## 2. CHI TIẾT CÁC VẤN ĐỀ ĐÃ BIẾT & GIẢI PHÁP VẬN HÀNH

### Issue #1: Snapshot dữ liệu sản phẩm trong đơn hàng lịch sử (Historical Order Items)
- **Mức độ:** MEDIUM
- **Hiện trạng:**
  - Bảng `order_items` ban đầu trong database schema chỉ chứa các trường: `(id, order_id, variant_id, quantity, price)`.
  - Nếu sản phẩm hoặc biến thể bị xóa / đổi tên trong tương lai, việc hiển thị lại lịch sử đơn hàng cũ phải phụ thuộc vào liên kết `JOIN product_variants`.
- **Giải pháp đã cung cấp:**
  - Đã xây dựng file migration an toàn: `database/migrations/20261105_add_order_items_snapshot.sql`.
  - Migration sử dụng cú pháp không phá hủy `ALTER TABLE ADD COLUMN` (`product_name`, `sku`, `size`, `color`), bổ sung chỉ mục và tự động backfill dữ liệu lịch sử từ bảng `product_variants`.
  - Backend đã sẵn sàng hỗ trợ đọc và ghi các trường snapshot này.
- **Khuyến nghị:** Thực thi migration này trong bảo trì hệ thống trước khi launch production.

---

### Issue #2: Cơ chế Rate-Limiting & Job định kỳ trên môi trường Multi-Instance / Cluster
- **Mức độ:** LOW / INFORMATIONAL
- **Hiện trạng:**
  - Hệ thống hiện sử dụng `express-rate-limit` với MemoryStore mặc định và Worker định kỳ chạy bằng `setInterval` trong tiến trình Node.js (mỗi 60s quét đơn hết hạn).
  - Khóa cơ sở dữ liệu `WITH (UPDLOCK, READPAST)` đã được tích hợp trong SQL Server để ngăn ngừa xung đột dữ liệu giữa các luồng.
  - Tuy nhiên, nếu triển khai trên cụm máy chủ phân tán nhiều máy chủ vật lý độc lập (Multi-Server / Kubernetes Horizontal Pod Autoscaler), bộ đếm rate-limit in-memory sẽ không đồng bộ giữa các node.
- **Khuyến nghị vận hành:**
  - Nếu chỉ chạy 1 Server hoặc PM2 Cluster trên cùng 1 server: Hệ thống hoạt động hoàn toàn ổn định và an toàn nhờ cơ chế DB Locking `READPAST`.
  - Nếu mở rộng sang cụm phân tán nhiều VPS độc lập: Tích hợp Redis Store (`rate-limit-redis`) cho `express-rate-limit` và chỉ định một Node Leader chạy job quét đơn hết hạn.

---

### Issue #3: Kiểm thử luồng tiền thật SePay (Live Bank Settlement)
- **Mức độ:** INFORMATIONAL
- **Hiện trạng:**
  - Trong môi trường kiểm toán và phát triển, API webhook và kiểm toán giao dịch được kiểm thử thông qua các mock HTTP request có chữ ký/token chuẩn và API test nội bộ.
  - Các giao dịch tiền thật biến động số dư ngân hàng qua App ngân hàng thực tế phụ thuộc vào việc cấu hình Webhook URL trên Dashboard `my.sepay.vn` trỏ về Domain Production có chứng chỉ SSL/TLS hợp lệ.
- **Khuyến nghị:**
  - Sau khi deploy lên Domain Production (có HTTPS), thực hiện 01 giao dịch thực tế trị giá 10.000 VNĐ qua SePay để nghiệm thu đường truyền Webhook từ máy chủ SePay về máy chủ Backend.

---

### Issue #4: Cảnh báo đóng gói Vite trên các trang tĩnh MPA (Non-module Script Tags)
- **Mức độ:** LOW (Không ảnh hưởng vận hành)
- **Hiện trạng:**
  - Khi chạy `npm run build` trên thư mục `frontend`, Vite hiển thị thông báo:
    `<script src="js/app.js"> in "/contact.html" can't be bundled without type="module" attribute`.
  - Tuy nhiên tiến trình build vẫn hoàn tất 100% trong ~470ms và toàn bộ file HTML, CSS, hình ảnh và thư mục JS được sao chép/tối ưu đầy đủ trong thư mục `frontend/dist/`.
- **Khuyến nghị:** Các trang tĩnh HTML thuần hoạt động bình thường khi phục vụ qua Nginx tĩnh hoặc HTTP server.

---

## 3. KẾT LUẬN VỀ RỦI RO VẬN HÀNH

Không có bất kỳ rủi ro nào ở mức độ CRITICAL hoặc HIGH cản trở việc triển khai dự án. Hệ thống đạt độ tin cậy cao, dữ liệu được bảo vệ an toàn bằng transaction và khóa phân tán cấp cơ sở dữ liệu.

