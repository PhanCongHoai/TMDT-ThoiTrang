# TÀI LIỆU THIẾT KẾ & VẬN HÀNH: LUỒNG THANH TOÁN TỔNG THỂ & SEPAY VIETQR
**Dự án:** AURALIÈ Haute Couture  
**Tài liệu tham chiếu:** `docs/PAYMENT_FLOW.md`  
**Trạng thái:** Đã triển khai và nghiệm thu thực tế (Phase 3.3.2)  

---

## 1. SƠ ĐỒ LUỒNG THANH TOÁN (SEPAY VIETQR FLOW)

```
[Khách Hàng (Browser)]           [AURALIÈ Backend Server]           [SePay Payment Gateway]       [Ngân Hàng MBBank/VCB]
          │                                  │                                  │                        │
  1. Nhấn "Thanh toán VietQR"                │                                  │                        │
          ├─────────────────────────────────►│                                  │                        │
          │  POST /api/v1/orders             │                                  │                        │
          │  (Tự tính tiền, tạo đơn PENDING) │                                  │                        │
          │                                  │                                  │                        │
  2. Hiển thị VietQR Modal                   │                                  │                        │
          │◄─────────────────────────────────┤                                  │                        │
          │  { orderCode: "AUR-...",         │                                  │                        │
          │    qrCodeUrl: "https://qr.sepay" }                                  │                        │
          │                                  │                                  │                        │
  3. Bật Polling 2.5s/lần                    │                                  │                        │
          ├─► GET /orders/:code/payment-status                                  │                        │
          │   (Trả về isPaid: false)         │                                  │                        │
          │                                  │                                  │                        │
  4. Khách quét mã & Chuyển tiền             │                                  │                        │
          └──────────────────────────────────┼──────────────────────────────────┼───────────────────────►│
                                             │                                  │                        │
                                             │                                  │ 5. Tiền vào tài khoản  │
                                             │                                  │◄───────────────────────┤
                                             │                                  │                        │
                                             │ 6. Gửi Webhook 24/7              │                        │
                                             │◄─────────────────────────────────┤                        │
                                             │  POST /api/v1/sepay/webhook      │                        │
                                             │  Headers: Authorization Apikey   │                        │
                                             │  Body: { transferAmount, content,│                        │
                                             │         referenceCode, id }      │                        │
                                             │                                  │                        │
                                             │ 7. XÁC MINH NGHIỆP VỤ AN TOÀN:   │                        │
                                             │ - Xác thực Header Apikey         │                        │
                                             │ - Kiểm tra Idempotency DB UNIQUE │                        │
                                             │ - Kiểm tra tiền vào (in)         │                        │
                                             │ - Bóc tách mã đơn chuẩn          │                        │
                                             │ - Đối chiếu số tiền tích lũy:    │                        │
                                             │   * Thiếu: PARTIALLY_PAID        │                        │
                                             │   * Đủ: PAID & CONFIRMED         │                        │
                                             │   * Thừa: PAID + overpaidAmount  │                        │
                                             │   * Đơn đã hủy: LATE_PAYMENT     │                        │
                                             │ - SQL Transaction + ROWLOCK      │                        │
                                             │                                  │                        │
                                             │ 8. Phản hồi Webhook 200 OK       │                        │
                                             ├─────────────────────────────────►│                        │
  9. Polling lần tiếp theo                   │                                  │                        │
          ├─────────────────────────────────►│                                  │                        │
          │  GET /orders/:code/payment-status│                                  │                        │
          │◄─────────────────────────────────┤                                  │                        │
          │  { isPaid: true, status: "CONFIRMED" }                              │                        │
          │                                  │                                  │                        │
 10. Chuyển sang màn hình Thành công         │                                  │                        │
```

---

## 2. NGUYÊN TẮC BẢO VỆ CHỐNG GIAN LẬN THANH TOÁN (PAYMENT SECURITY GUARDS)

### 2.1 Webhook Idempotency (Chống xử lý lặp lại)
- **Ràng buộc:** Bảng `payment_transactions` sở hữu chỉ mục duy nhất `UQ__payment___DD5740BEE83CA53E` trên cột `transaction_code`.
- **Cơ chế:**
  1. Kiểm tra trước qua `OrderRepository.findTransactionByCode(transactionCode)`.
  2. Khóa và ghi nhận trong SQL Server Transaction (`UPDLOCK, ROWLOCK`).
  3. Bắt mã lỗi SQL Server `2627` / `2601` khi xảy ra xung đột đồng thời để tự động rollback và trả về thông báo idempotent an toàn cho SePay.

### 2.2 Quy tắc kiểm tra số tiền (Amount Validation)
1. **Chuyển thiếu (`accumulatedPaid < order.total_amount`):**
   - Ghi nhận dòng giao dịch vào `payment_transactions` (status: `SUCCESS`).
   - Cập nhật `payment_status = 'PARTIALLY_PAID'`.
   - Giữ nguyên `status = 'PENDING'` (Không xác nhận đơn, không xuất kho).
2. **Chuyển đúng (`accumulatedPaid == order.total_amount`):**
   - Ghi nhận dòng giao dịch vào `payment_transactions`.
   - Cập nhật `payment_status = 'PAID'` và `status = 'CONFIRMED'`.
3. **Chuyển thừa (`accumulatedPaid > order.total_amount`):**
   - Ghi nhận toàn bộ số tiền thực nhận vào `payment_transactions`.
   - Cập nhật `payment_status = 'PAID'` và `status = 'CONFIRMED'`.
   - Trả về và ghi log `overpaidAmount` phục vụ đối soát và hoàn tiền thừa cho khách.

### 2.3 Xử lý giao dịch đến muộn (Late Arrival Payments)
- Nếu đơn hàng đã bị hủy do hết hạn giữ hàng 15 phút (`status = 'CANCELLED'`):
  - Tuyệt đối **không** tự động đổi sang `CONFIRMED` hay phục hồi đơn hàng (vì tồn kho đã được hoàn về kệ cho khách khác).
  - Giao dịch vẫn được lưu vào `payment_transactions` với trạng thái `LATE_PAYMENT`.
  - Giữ nguyên `orders.status = 'CANCELLED'`.
  - Kích hoạt luồng đối soát cho bộ phận kế toán / chăm sóc khách hàng.

### 2.4 Bảo vệ Endpoint Giả lập (`/api/v1/sepay/simulate-payment`)
- **Môi trường Production (`NODE_ENV === 'production'`):** Chặn hoàn toàn bằng middleware, trả về `403 Forbidden`.
- **Môi trường Development:** Yêu cầu đăng nhập tài khoản có quyền `ADMIN` (`verifyToken`, `requireAdmin`). Khách hàng thông thường hoặc khách vãng lai bị từ chối truy cập.
- Thực thi toàn bộ kiểm tra nghiệp vụ và ghi nhận `payment_transactions` thông qua SQL Transaction.
