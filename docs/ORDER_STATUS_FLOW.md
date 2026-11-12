# TÀI LIỆU QUY CHUẨN: BẢNG CHUYỂN TRẠNG THÁI ĐƠN HÀNG & THANH TOÁN
**Dự án:** AURALIÈ Haute Couture  
**Tài liệu tham chiếu:** `docs/ORDER_STATUS_FLOW.md`  
**File mã nguồn thực thi:** [`backend/src/modules/orders/orders.state-machine.js`](file:///c:/Users/ASUS/Documents/Demo/DATN/backend/src/modules/orders/orders.state-machine.js)  
**Trạng thái:** Đã triển khai và kiểm thử 100% trong Master Test Suite  

---

## 1. PHÂN BIỆT 2 TRỤC TRẠNG THÁI ĐỘC LẬP
1. **Trạng thái Đơn hàng (`orders.status`):**
   - `PENDING`: Đơn hàng mới tạo, đang chờ thanh toán VietQR hoặc chờ duyệt.
   - `CONFIRMED`: Đã xác nhận đơn (đã thanh toán hoặc duyệt đơn COD).
   - `PROCESSING`: Đang may đo thủ công, đính kết và kiểm định chất lượng tại Atelier.
   - `SHIPPED`: Đã bàn giao cho đơn vị vận chuyển GHN Express (có tracking code).
   - `COMPLETED`: Giao hàng thành công (Terminal State - Không thể chuyển ngược).
   - `CANCELLED`: Đã hủy đơn và hoàn tồn kho (Terminal State - Không thể kích hoạt lại).

2. **Trạng thái Tài chính / Thanh toán (`orders.payment_status`):**
   - `UNPAID`: Chưa thanh toán.
   - `PARTIALLY_PAID`: Đã nhận tiền nhưng chưa đủ số tiền đơn hàng (chuyển thiếu).
   - `PAID`: Đã thanh toán đủ hoặc thừa tiền.
   - `REFUNDED`: Đã hoàn tiền cho khách.

---

## 2. MA TRẬN CHUYỂN TRẠNG THÁI HỢP LỆ (STATE MACHINE MATRIX)

```
[ PENDING ] ────────► [ CONFIRMED ] ────────► [ PROCESSING ] ────────► [ SHIPPED ] ────────► [ COMPLETED ] (Terminal)
     │                       │                        │                     │
     └───────────────────────┴────────────────────────┴─────────────────────┴───────────────► [ CANCELLED ] (Terminal)
```

| Trạng thái hiện tại | Các trạng thái tiếp theo ĐƯỢC PHÉP | Các trạng thái BỊ CHẶN (Ném lỗi 400) | Hành động hoàn kho |
|---|---|---|:---:|
| `PENDING` | `CONFIRMED`, `CANCELLED` | `PROCESSING`, `SHIPPED`, `COMPLETED` | Có (nếu CANCELLED) |
| `CONFIRMED` | `PROCESSING`, `CANCELLED` | `PENDING`, `SHIPPED`, `COMPLETED` | Có (nếu CANCELLED) |
| `PROCESSING` | `SHIPPED`, `CANCELLED` | `PENDING`, `CONFIRMED`, `COMPLETED` | Có (nếu CANCELLED) |
| `SHIPPED` | `COMPLETED`, `CANCELLED` | `PENDING`, `CONFIRMED`, `PROCESSING` | Có (nếu CANCELLED) |
| `COMPLETED` | ❌ KHÔNG (Terminal State) | Mọi trạng thái | Không (Không cho phép hủy) |
| `CANCELLED` | ❌ KHÔNG (Terminal State) | Mọi trạng thái | Đã hoàn kho từ trước |

---

## 3. CÁC QUY TẮC RÀNG BUỘC NGHIỆP VỤ BẮT BUỘC
1. **Ràng buộc Thanh toán Online:** Tuyệt đối không cho phép chuyển đơn sang `SHIPPED` hoặc `COMPLETED` nếu đơn thanh toán online (`payment_method` là `SEPAY_QR` hoặc `VISA`) mà `payment_status !== 'PAID'`.
2. **Chống Hồi Sinh Đơn Đã Hủy:** Khi một đơn hàng đã bị hủy do hết hạn 15 phút, tồn kho đã được trả lại cho khách hàng khác mua. Hệ thống cấm tuyệt đối việc Admin chuyển đơn từ `CANCELLED` về `CONFIRMED` để ngăn chặn việc bán âm kho.
3. **Phân Quyền Hủy Đơn:**
   - Khách hàng chỉ được hủy đơn khi đang ở trạng thái `PENDING` hoặc `CONFIRMED`. Khi đơn đã vào giai đoạn `PROCESSING` (xưởng đã cắt vải) hoặc `SHIPPED`, khách hàng phải liên hệ trực tiếp tổng đài VIP.
   - Admin có quyền hủy đơn kèm lý do đối soát và hệ thống tự động hoàn kho an toàn.
