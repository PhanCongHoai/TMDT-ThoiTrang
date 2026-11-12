# HƯỚNG DẪN KIỂM THỬ HỆ THỐNG (TESTING GUIDE)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  

---

## 1. CÁC CÔNG CỤ & PHẠM VI KIỂM THỬ
Hệ thống sử dụng bộ kiểm thử tự động viết bằng Node.js kết hợp thư viện `assert` tích hợp, tương tác trực tiếp với cơ sở dữ liệu Microsoft SQL Server (`AURALIE_FashionDB`) và Express HTTP API.

---

## 2. HƯỚNG DẪN CHẠY BỘ KIỂM THỬ

### 2.1 Kiểm tra Cú pháp Toàn bộ Mã nguồn Backend
Để bảo đảm không có lỗi cú pháp JavaScript:
```bash
cd backend
node -c src/modules/orders/orders.state-machine.js
node -c src/modules/orders/orders.repository.js
node -c src/modules/orders/orders.service.js
node -c src/modules/orders/orders.controller.js
node -c src/modules/orders/orders.routes.js
node -c src/app.js
node -c src/server.js
```

### 2.2 Kiểm tra Build Frontend (Vite)
Để bảo đảm giao diện đóng gói chuẩn xác và không có lỗi tài nguyên tĩnh:
```bash
cd frontend
npm run build
```
*Thời gian build chuẩn: ~350 - 550ms.*

### 2.3 Chạy Bộ Kiểm Thử Master Test Suite
Bộ kiểm thử tích hợp toàn bộ các kịch bản:
- **Unit Test:** Kiểm tra ma trận chuyển trạng thái `OrderStateMachine` (chặn chuyển `COMPLETED` sang `CANCELLED`, chặn `CANCELLED` sang `CONFIRMED`).
- **Integration Test:** Đăng ký tài khoản, đăng nhập tạo token JWT, đặt đơn hàng COD tự tính giá, xem `my-orders`, xem chi tiết đơn hàng, tra cứu phân trang Admin.
- **Security & IDOR Test:** Khách hàng A truy cập đơn hàng Khách hàng B bị trả về `403 Forbidden`; tra cứu công khai bị Mask số điện thoại và địa chỉ; mô phỏng thanh toán SePay bị chặn ở môi trường Production.
- **Concurrency Test:**
  - 5 người cùng đặt 1 sản phẩm còn tồn kho 2 chiếc: Kết quả chính xác 2 người mua thành công, 3 người bị từ chối hết hàng, tồn kho về đúng 0, không âm.
  - 5 người cùng đặt hàng với mã Coupon chỉ còn 2 lượt dùng: Chính xác 2 đơn được áp dụng, 3 đơn bị từ chối, `used_count` dừng ở 2.

Chạy lệnh:
```bash
cd backend
npm test
# hoặc
node test/master.test.js
```

---

## 3. CHECKLIST KIỂM THỬ THỦ CÔNG (MANUAL QA CHECKLIST)

| STT | Luồng kiểm thử | Thao tác thực hiện | Kết quả kỳ vọng |
|:---:|---|---|---|
| 1 | Thêm vào giỏ hàng | Chọn sản phẩm, chọn Size (M), Màu (Đen Tuyền), nhấn "Thêm Giỏ Hàng" | Giỏ hàng tăng số lượng, lưu vào `localStorage` |
| 2 | Áp dụng Coupon | Nhập mã `AURALIE2026` trong trang `cart.html`, nhấn "Áp Dụng" | Hiển thị thông báo thành công, giảm 20% tổng tiền |
| 3 | Đặt hàng COD | Chọn "Thanh toán khi nhận hàng", nhấn Đặt Hàng | Đơn được tạo, trạng thái `CONFIRMED`, chuyển về `profile.html#orders` |
| 4 | Đặt hàng SePay | Chọn "SePay VietQR 24/7", nhấn Thanh Toán | Hiển thị popup chứa mã VietQR động, số tiền và nội dung chuyển khoản |
| 5 | Tra cứu đơn hàng | Vào menu "Tra cứu", nhập mã đơn `AUR-YYYYMMDD-...` | Hiển thị lộ trình vận chuyển, mã vận đơn GHN |
| 6 | Hủy đơn cá nhân | Vào `profile.html#orders`, nhấn "Hủy Đơn" tại đơn đang PENDING/CONFIRMED | Đơn chuyển sang `CANCELLED`, tồn kho được hoàn trả |
| 7 | Quản trị Admin | Vào `admin.html`, xem danh sách đơn, chọn cập nhật trạng thái | Đơn được cập nhật trạng thái hợp lệ, vi phạm sẽ bị cảnh báo |

