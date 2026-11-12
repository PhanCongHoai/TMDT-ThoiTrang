# BÁO CÁO AUDIT CHUYÊN SÂU: NGHIỆP VỤ ORDERS & SEPAY PAYMENT
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Tài liệu tham chiếu:** `docs/ORDERS_AUDIT.md`  
**Vai trò:** Senior Backend Architect, Payment Systems Engineer & Database Security Engineer  
**Phiên bản audit:** v2.0-comprehensive (Không thực hiện sửa đổi mã nguồn)  

---

## MỤC LỤC
1. [Đối chiếu Code thực tế & Inventory (`docs/BACKEND_API_INVENTORY.md`)](#1-đối-chiếu-code-thực-tế--inventory)
2. [Phân tích & Quản lý Mã Đơn Hàng (Order Code Collision Risk)](#2-phân-tích--quản-lý-mã-đơn-hàng-order-code)
3. [Order Item Snapshot (Bảo toàn dữ liệu lịch sử mua hàng)](#3-order-item-snapshot-bảo-toàn-dữ-liệu-lịch-sử)
4. [Inventory Reservation & Lifecycle (Trừ kho, Giữ hàng, Hoàn kho)](#4-inventory-reservation--lifecycle)
5. [Cơ chế Xác thực & Kiểm soát SePay Webhook (Chi tiết kỹ thuật)](#5-cơ-chế-xác-thực--kiểm-soát-sepay-webhook)
6. [Payment Amount Validation (Chuyển thiếu, Đúng, Thừa & Đa giao dịch)](#6-payment-amount-validation)
7. [Kiểm soát & Vô hiệu hóa Endpoint Giả lập (Simulate Payment Protection)](#7-kiểm-soát--vô-hiệu-hóa-endpoint-giả-lập)
8. [Phân quyền, Truy cập Đơn hàng & Chống IDOR (Authorization Matrix)](#8-phân-quyền-truy-cập-đơn-hàng--chống-idor)
9. [Bảng Chuyển Trạng Thái Đơn hàng & Thanh toán (State Transition Matrix)](#9-bảng-chuyển-trạng-thái-đơn-hàng--thanh-toán)
10. [Bảng Tổng Hợp Phát Hiện Rủi Ro (Risk Matrix: Critical - High - Med - Low)](#10-bảng-tổng-hợp-phát-hiện-rủi-ro)

---

## 1. ĐỐI CHIẾU CODE THỰC TẾ & INVENTORY

Qua đối chiếu giữa `backend/src/modules/orders/orders.routes.js`, `orders.service.js`, `orders.controller.js` và `docs/BACKEND_API_INVENTORY.md`:

| Endpoint thực tế trong Code | Phương thức | Hiện trạng trong Code | Hiện trạng trong Inventory | Đánh giá & Rủi ro |
|---|:---:|---|---|---|
| `/api/v1/orders` | `POST` | Tồn tại (`orders.routes.js:6`) | Dòng 22 (Optional Auth) | 🔴 **CRITICAL**: Không validate giá tiền từ CSDL, không lưu `order_items`, không trừ kho. Cho phép client gửi `userId` tùy ý nếu chưa đăng nhập. |
| `/api/v1/orders/:orderCode/payment-status` | `GET` | Tồn tại (`orders.routes.js:7`) | Dòng 23 (Public) | 🟢 **OK**: Phục vụ Frontend polling 2.5s/lần từ SePay VietQR Modal. |
| `/api/v1/orders/track/:code` | `GET` | Tồn tại (`orders.routes.js:8`) | Dòng 26 (Public) | 🟡 **MEDIUM**: Lộ địa chỉ giao hàng và họ tên khách hàng công khai qua mã đơn (AUR-YYYY-XXX dễ bị brute-force tuần tự). |
| `/api/v1/sepay/config` | `GET` | Tồn tại (`orders.routes.js:11`) | Dòng 21 (Public) | 🟢 **OK**: Lấy STK/Tên ngân hàng công khai hiển thị mã VietQR. |
| `/api/v1/sepay/webhook` | `POST` | Tồn tại (`orders.routes.js:12`) | Dòng 24 (ApiKey Verify) | 🔴 **CRITICAL**: ApiKey fallback nếu rỗng (`sepay_api_key_sample_auralie_2026`). Regex khớp mã đơn hàng có thể match nhầm nếu nội dung chứa chuỗi phụ. Chưa kiểm tra số tiền chuyển đúng hay thiếu. |
| `/api/v1/sepay/simulate-payment` | `POST` | Tồn tại (`orders.routes.js:13`) | Dòng 25 (Public Demo) | 🔴 **CRITICAL**: Mở public hoàn toàn, bất kỳ ai gửi `POST { orderCode: "AUR-..." }` đều tự động chuyển đơn sang `PAID` và `CONFIRMED` mà không cần quyền Admin hay chữ ký. |
| `/api/v1/orders` | `GET` | Tồn tại (`orders.routes.js:16`) | Dòng 27 (Admin only) | 🟢 **OK**: Đã được bảo vệ qua `verifyToken` và `requireAdmin`. |
| `/api/v1/orders/:id/status` | `PUT` | Tồn tại (`orders.routes.js:17`) | Dòng 28 (Admin only) | 🟡 **MEDIUM**: Nhận trạng thái bất kỳ từ client, không kiểm tra luồng chuyển trạng thái hợp lệ (State Machine Guard). |
| `/api/v1/orders/my-orders` | `GET` | ❌ **CHƯA CÓ** | Không có | 🟠 **HIGH**: Khách hàng hiện phải gọi `/api/v1/users/profile` để lấy danh sách đơn, không có endpoint chuyên biệt phân trang cho đơn cá nhân. |

---

## 2. PHÂN TÍCH & QUẢN LÝ MÃ ĐƠN HÀNG (ORDER CODE)

### Bằng chứng code hiện tại:
```javascript
// backend/src/modules/orders/orders.service.js:13
const orderCode = 'AUR-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
```

### Phân tích nguy cơ va chạm (Collision Risk):
- `Math.floor(100 + Math.random() * 900)` sinh ra một số nguyên ngẫu nhiên từ 100 đến 999 (chỉ có đúng **900 giá trị khả dĩ** trong 1 năm).
- Theo nguyên lý nghịch lý ngày sinh (Birthday Paradox):
  - Khi hệ thống đạt **36 đơn hàng** trong năm, xác suất xảy ra đụng độ mã đơn hàng là **~50%**.
  - Khi hệ thống đạt **60 đơn hàng**, xác suất đụng độ vượt **~85%**.
- Trong CSDL, trường `order_code` có ràng buộc `UNIQUE`. Khi xảy ra va chạm, câu lệnh `INSERT` sẽ quăng lỗi vi phạm khóa duy nhất `Violation of UNIQUE KEY constraint`, làm sập request đặt hàng của khách hàng với lỗi HTTP 500.

### Đề xuất phương án thiết kế (Production Standard):
1. **Định dạng mới:** `AUR-{YYYY}{MM}{DD}-{RANDOM_ALPHANUM_6}` hoặc kết hợp NanoID / Sequence:
   - Ví dụ: `AUR-20261105-X7K9P2` (Không gian khả dĩ: $36^6 \approx 2.17$ tỷ giá trị / ngày, triệt tiêu xác suất đụng độ).
2. **Cơ chế Retry ở Service:** Bọc hàm sinh mã trong vòng lặp thử lại tối đa 3 lần nếu phát hiện trùng mã trước khi quăng lỗi.
3. **Nội dung SePay dễ nhận diện:** Duy trì tiền tố `AUR` để webhook SePay dễ dàng dùng biểu thức chính quy bắt chính xác mã đơn.

---

## 3. ORDER ITEM SNAPSHOT (BẢO TOÀN DỮ LIỆU LỊCH SỬ)

### Bằng chứng cấu trúc CSDL hiện tại:
```sql
-- database/sqlserver_setup.sql:98
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Variants FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);
```

### Bằng chứng code hiện tại:
- Trong `orders.service.js:20-33`, hàm `createOrder` chỉ thực hiện `INSERT INTO orders` và **bỏ qua hoàn toàn việc INSERT vào bảng `order_items`**.
- Biến `cartItems` gửi từ client bị bỏ rơi, không được lưu trữ.

### Phân tích nghiệp vụ Snapshot:
- Trong thương mại điện tử xa xỉ (Haute Couture), giá sản phẩm, chất liệu, tên gọi và SKU có thể thay đổi hoặc bị xóa mềm theo từng mùa thời trang (BST mới).
- Nếu chỉ lưu `variant_id` và `price`: Khi sản phẩm bị cập nhật tên, sửa size hoặc xóa mềm trong kho, lịch sử đơn hàng của khách hàng và kế toán sẽ bị sai lệch hoặc mất thông tin đối soát.
- **Yêu cầu bảo toàn dữ liệu (Snapshot Requirement):**
  - Cần bảo đảm lưu trữ: `product_name`, `variant_sku`, `size`, `color`, `unit_price`, `quantity`, `subtotal`.
  - *Lưu ý Audit:* Không tự ý sửa schema CSDL trong giai đoạn này. Khi lưu `order_items`, giải pháp an toàn là lưu đúng các cột hiện có (`variant_id`, `quantity`, `price`), đồng thời đề xuất kế hoạch migration bổ sung các cột snapshot trong tương lai mà không phá vỡ schema hiện tại.

---

## 4. INVENTORY RESERVATION & LIFECYCLE (QUẢN LÝ TỒN KHO ĐƠN HÀNG)

### Hiện trạng:
- Hệ thống hiện tại **hoàn toàn không có logic trừ kho khi đặt hàng**.
- Trường `stock_quantity` trong bảng `product_variants` luôn giữ nguyên dù đơn hàng được tạo liên tục.

### Thiết kế chu trình Tồn kho chuẩn Enterprise:

```
[Giỏ Hàng] 
    │
    ▼ Khách nhấn "Đặt hàng"
[Tạo Đơn Hàng: PENDING] ──► TRỪ KHO TỨC THÌ (Inventory Reservation)
    │                       - Đặt hạn chót giữ kho (TTL): 15 phút (SePay VietQR)
    │                       - Lưu timestamp `reservation_expires_at`
    │
    ├─────────────────────────────┬─────────────────────────────┐
    ▼ (Thanh toán thành công)     ▼ (Khách hủy / Admin hủy)     ▼ (Quá 15 phút không thanh toán)
[Trạng thái: CONFIRMED]      [Trạng thái: CANCELLED]        [Trạng thái: EXPIRED]
    │                             │                              │
    │ Giữ nguyên trừ kho          ▼                              ▼
    │ Không hoàn lại             HOÀN TRẢ TỒN KHO               HOÀN TRẢ TỒN KHO
    ▼                            (Atomic Restock)               (Auto-Release Worker)
[Xuất kho: COMPLETED]
```

### 4.1 Quy tắc Chống Bán vượt tồn kho (Race Condition Prevention)
Khi 2 khách hàng cùng đặt mua chiếc áo cuối cùng (`stock_quantity = 1`):
- Không dùng mô hình: `SELECT stock_quantity` -> kiểm tra JS -> `UPDATE`. Cách này gây Race Condition nghiêm trọng.
- Phải dùng câu lệnh **Atomic Conditional Update** trong SQL Server Transaction:
  ```sql
  UPDATE product_variants WITH (UPDLOCK, ROWLOCK)
  SET stock_quantity = stock_quantity - @quantity
  WHERE id = @variantId AND stock_quantity >= @quantity;
  ```
- Kiểm tra `rowsAffected`: Nếu bằng 0, hủy Transaction ngay và quăng lỗi: *"Rất tiếc, sản phẩm [Tên sản phẩm] vừa hết hàng hoặc không đủ số lượng tồn kho."*

### 4.2 Cơ chế Chống Hoàn kho nhiều lần (Double-Restock Prevention)
- Khi đơn hàng bị hủy hoặc hết hạn, việc hoàn kho chỉ được kích hoạt nếu trạng thái đơn hàng chuyển từ `PENDING` -> `CANCELLED`/`EXPIRED`.
- Đơn hàng đã `CANCELLED` thì cấm tuyệt đối không được gọi hàm hoàn kho thêm lần nào nữa (Idempotent Restock Guard).

---

## 5. CƠ CHẾ XÁC THỰC & KIỂM SOÁT SEPAY WEBHOOK

### Bằng chứng code hiện tại:
```javascript
// backend/src/modules/orders/orders.service.js:108
if (cfg.apiKey && cfg.apiKey !== 'sepay_api_key_sample_auralie_2026') {
  const expected = `Apikey ${cfg.apiKey}`;
  if (authHeader !== expected && authHeader !== cfg.apiKey) {
    const err = new Error('Unauthorized SePay Webhook');
    err.statusCode = 401;
    throw err;
  }
}
```

### Điểm hổng an ninh xác minh được:
1. **Bypass xác thực nếu dùng default key:** Nếu file `.env` chưa đặt `SEPAY_API_KEY` hoặc đặt bằng chuỗi mẫu `'sepay_api_key_sample_auralie_2026'`, điều kiện `if` bị vô hiệu hóa, server chấp nhận webhook từ bất kỳ ai gửi tới mà không cần API key.
2. **Đối chiếu mã đơn hàng lỏng lẻo:**
   - Dùng `const match = content.match(/AUR-\d{4}-\d+/i);`.
   - Nếu không match, chạy vòng lặp tìm `TOP 20` đơn `UNPAID` và kiểm tra `content.includes(order_code)`. Nếu nội dung chuyển khoản ngẫu nhiên có chứa cụm từ, đơn hàng có thể bị kích hoạt nhầm.
3. **Idempotency chưa có cơ chế khóa mức CSDL:**
   - Việc kiểm tra trùng lặp chỉ thực hiện bằng cách INSERT vào `payment_transactions` trong khối `try/catch` sau khi câu lệnh `UPDATE orders SET payment_status = 'PAID'` đã chạy xong.
   - Nếu 2 webhook gửi đến cùng 1 mili-giây, cả 2 tiến trình đều chạy `UPDATE orders` trước khi INSERT transaction, vi phạm tính toàn vẹn Idempotency.

---

## 6. PAYMENT AMOUNT VALIDATION (KIỂM SOÁT SỐ TIỀN THANH TOÁN)

### Phân tích các kịch bản số tiền:
Code hiện tại (`orders.service.js:159`):
```javascript
amount: Number(transferAmount) || matchedOrder.total_amount
```
Hệ thống **hoàn toàn không so sánh** số tiền chuyển khoản với số tiền cần thanh toán!

### Bảng xử lý nghiệp vụ cho từng kịch bản:

| Trường hợp | Điều kiện so sánh | Hành động của Hệ thống | Trạng thái Đơn hàng | Trạng thái Thanh toán |
|---|---|---|---|---|
| **Chuyển đúng** | `transferAmount === order.total_amount` | Xác nhận đơn hàng thành công, sinh mã giao dịch. | `CONFIRMED` | `PAID` |
| **Chuyển thiếu** | `transferAmount < order.total_amount` | **CẤM DUYỆT ĐƠN.** Ghi nhận giao dịch vào `payment_transactions` với trạng thái `PARTIAL_PAID`. Gửi thông báo yêu cầu chuyển tiếp số tiền còn thiếu. Không kích hoạt xuất kho. | `PENDING` | `PARTIALLY_PAID` |
| **Chuyển thừa** | `transferAmount > order.total_amount` | Chấp nhận thanh toán đơn hàng (tránh làm gián đoạn trải nghiệm khách VIP). Ghi nhận số tiền thực nhận vào log giao dịch, tạo ghi chú hoàn tiền thừa cho bộ phận Kế toán / Concierge VIP. | `CONFIRMED` | `OVERPAID` / `PAID` |
| **Nhiều lần chuyển (Gộp đơn)** | $\sum \text{transfers} = \text{total\_amount}$ | Lưu từng giao dịch thành phần vào `payment_transactions`. Chỉ khi tổng số tiền tích lũy đủ thì mới chuyển `payment_status = 'PAID'`. | `CONFIRMED` | `PAID` |

---

## 7. KIỂM SOÁT & VÔ HIỆU HÓA ENDPOINT GIẢ LẬP (SIMULATE PAYMENT)

### Bằng chứng code hiện tại:
- Endpoint: `POST /api/v1/sepay/simulate-payment` (`orders.routes.js:13`).
- Hàm: `simulatePayment(orderCode)` (`orders.service.js:176`).
- **Lỗ hổng nghiêm trọng (`SEC-C01 / SEC-C04`):**
  - Không có bất kỳ middleware bảo vệ nào (`verifyToken`, `requireAdmin`).
  - Frontend (`app.js:2109`) có nút *"Giả Lập SePay Khớp Lệnh Tức Thì"*. Bất kỳ khách hàng nào mở F12 hoặc gửi curl đều có thể tự đánh dấu đơn hàng của mình thành `PAID` và `CONFIRMED` mà không phải trả tiền.

### Đề xuất phương án khóa bảo mật (Lockdown Strategy):
1. **Kiểm tra môi trường (`NODE_ENV`):**
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     return ApiResponse.error(res, 'Tính năng giả lập thanh toán bị vô hiệu hóa trên môi trường Production.', 403);
   }
   ```
2. **Yêu cầu quyền Admin:** Ngay cả ở môi trường phát triển (Development / Demo), endpoint này bắt buộc phải yêu cầu `verifyToken` và `requireAdmin`. Khách vãng lai và tài khoản `CUSTOMER` tuyệt đối không được phép gọi endpoint này.

---

## 8. PHÂN QUYỀN, TRUY CẬP ĐƠN HÀNG & CHỐNG IDOR

### Bằng chứng code hiện tại:
- `orders.routes.js:6`:
  ```javascript
  router.post('/orders', optionalAuth, OrderController.createOrder);
  ```
- `orders.controller.js:8`:
  ```javascript
  const userId = req.user ? req.user.id : (req.body.userId || 2);
  ```
  Nếu không có token đăng nhập, backend tự động gán `userId = req.body.userId || 2` (Gán đơn hàng vào tài khoản của user ID=2 - Bà Nguyễn Thanh Vân)!
- `orders.service.js:199` (`trackOrder`):
  - Nhận `code` từ URL params, tìm đơn hàng và trả về đầy đủ `customerName`, `shippingAddress`, `phone_number`.
  - Không kiểm tra quyền sở hữu đơn hàng! Kẻ tấn công có thể đoán mã `AUR-2026-XXX` để đọc trộm địa chỉ nhà và số điện thoại của khách hàng khác (Lỗ hổng **IDOR - Insecure Direct Object References**).

### Ma trận Phân quyền Chuẩn (Authorization Matrix):

| Hành vi nghiệp vụ | Role Khách Vãng Lai (Guest) | Role Khách Hội Viên (CUSTOMER) | Role Quản Trị Viên (ADMIN) |
|---|:---:|:---:|:---:|
| **Tạo đơn hàng** | Cho phép (tạo đơn ẩn danh, `user_id = NULL`) | Cho phép (lấy `user_id` từ JWT token, cấm lấy từ body) | Cho phép |
| **Xem danh sách đơn** | ❌ Cấm | Chỉ xem đơn của chính mình (`WHERE user_id = req.user.id`) | Xem toàn bộ đơn hàng trong hệ thống |
| **Xem chi tiết đơn** | Chỉ xem qua mã đơn + SĐT xác thực | Chỉ xem đơn do mình sở hữu | Xem toàn quyền |
| **Tra cứu vận đơn** | Che giấu bớt thông tin (Mặt nạ SĐT: `0908***999`, địa chỉ quận/tỉnh) | Xem chi tiết nếu là chủ đơn | Xem toàn quyền |
| **Cập nhật trạng thái** | ❌ Cấm | ❌ Cấm (chỉ được yêu cầu Hủy khi đơn còn `PENDING`) | Cho phép cập nhật quy trình xuất kho |

---

## 9. BẢNG CHUYỂN TRẠNG THÁI HỢP LỆ (STATE TRANSITION MATRIX)

Hệ thống phân định độc lập 2 trạng thái: **Trạng thái Đơn hàng (`status`)** và **Trạng thái Thanh toán (`payment_status`)**.

### 9.1 Ma trận Chuyển Trạng thái Đơn hàng (`status`):

| Trạng thái hiện tại | Trạng thái kế tiếp hợp lệ | Điều kiện kích hoạt | Trạng thái không hợp lệ (Bị chặn) |
|---|---|---|---|
| `PENDING` | `CONFIRMED` | Thanh toán SePay khớp lệnh hoặc Admin xác nhận đơn COD | `SHIPPED`, `COMPLETED` |
| `PENDING` | `CANCELLED` | Khách hàng hủy đơn hoặc quá hạn giữ kho (15 phút) | `COMPLETED` |
| `CONFIRMED` | `PROCESSING` | Xưởng Atelier bắt đầu may đo / đóng gói | `PENDING`, `CANCELLED` (sau 24h) |
| `PROCESSING` | `SHIPPED` | Đã bàn giao cho đơn vị vận chuyển GHN Express | `PENDING`, `COMPLETED` |
| `SHIPPED` | `COMPLETED` | Khách hàng đã ký nhận bưu kiện | `PENDING`, `PROCESSING`, `CANCELLED` |
| `SHIPPED` | `CANCELLED` | Giao hàng thất bại 3 lần / Khách từ chối nhận hàng | `PROCESSING` |
| `COMPLETED` | *(Trạng thái kết thúc)* | Không cho phép đổi trạng thái | Tất cả |
| `CANCELLED` | *(Trạng thái kết thúc)* | Không cho phép đổi trạng thái | Tất cả |

### 9.2 Ma trận Chuyển Trạng thái Thanh toán (`payment_status`):

| Trạng thái hiện tại | Trạng thái kế tiếp hợp lệ | Tác nhân kích hoạt |
|---|---|---|
| `UNPAID` | `PAID` | SePay Webhook nhận đủ tiền / Thu tiền COD thành công |
| `UNPAID` | `PARTIALLY_PAID` | Chuyển khoản thiếu tiền |
| `PARTIALLY_PAID` | `PAID` | Chuyển khoản bổ sung đủ tiền |
| `PAID` | `REFUNDED` | Đơn hàng bị hủy sau khi đã thanh toán (Admin hoàn tiền) |

---

## 10. BẢNG TỔNG HỢP PHÁT HIỆN RỦI RO (RISK MATRIX)

| Mã ID | Mức độ | Vấn đề phát hiện | Bằng chứng mã nguồn | Ảnh hưởng nghiệp vụ | Phương án xử lý khi triển khai |
|---|:---:|---|---|---|---|
| `ORD-C01` | 🔴 **CRITICAL** | Endpoint giả lập SePay mở tự do cho mọi người dùng | `orders.routes.js:13`, `orders.service.js:176` | Khách hàng tự xác nhận thanh toán đơn mà không chuyển tiền | Khóa hoàn toàn ở Production; yêu cầu Admin token ở môi trường Dev |
| `ORD-C02` | 🔴 **CRITICAL** | Tin tưởng giá tiền từ client (`totalAmount`) | `orders.service.js:15`, `orders.controller.js:7` | Kẻ tấn công có thể sửa giá đơn hàng thành 1.000đ | Backend tự duyệt items trong giỏ, truy vấn giá gốc từ CSDL và tính lại |
| `ORD-C03` | 🔴 **CRITICAL** | Bỏ rơi `cartItems`, không lưu `order_items` | `orders.service.js:20-43` | Đơn hàng tạo ra không có chi tiết sản phẩm, không thể xuất kho | Dùng SQL Server Transaction lưu song song `orders` và `order_items` |
| `ORD-H01` | 🟠 **HIGH** | Không có logic trừ tồn kho khi tạo đơn | `orders.service.js:createOrder` | Bán vượt tồn kho (Overselling), âm kho trang phục độc bản | Atomic Conditional UPDATE trên bảng `product_variants` trong Transaction |
| `ORD-H02` | 🟠 **HIGH** | Không xác thực số tiền chuyển khoản từ SePay | `orders.service.js:159` | Chuyển thiếu tiền vẫn được duyệt đơn thành `PAID` | So sánh `transferAmount >= order.total_amount` |
| `ORD-H03` | 🟠 **HIGH** | Va chạm mã đơn hàng ngẫu nhiên (`AUR-YYYY-XXX`) | `orders.service.js:13` | Lỗi sập hệ thống khi đơn hàng vượt quá 30 đơn/năm | Tăng độ dài mã đơn, kết hợp timestamp và hàm sinh mã độc nhất |
| `ORD-M01` | 🟡 **MEDIUM** | Lộ thông tin nhạy cảm qua endpoint tra cứu đơn | `orders.routes.js:8`, `orders.service.js:199` | Rò rỉ địa chỉ và số điện thoại khách hàng (IDOR) | Che mặt nạ thông tin nhạy cảm đối với người tra cứu công khai |
| `ORD-M02` | 🟡 **MEDIUM** | Mặc định gán đơn hàng cho user ID=2 | `orders.controller.js:8` | Sai lệch chủ sở hữu đơn hàng của khách hàng | Đơn vãng lai lưu `user_id = NULL`; khách đăng nhập lấy ID từ JWT |
| `ORD-L01` | 🟢 **LOW** | Thiếu tài liệu quy trình thanh toán và trạng thái | Chưa có tài liệu thiết kế chi tiết | Khó bảo trì, hiểu nhầm giữa trạng thái đơn và thanh toán | Tạo tài liệu thiết kế `docs/PAYMENT_FLOW.md` và `docs/ORDER_STATUS_FLOW.md` |

---

## 11. KẾT LUẬN & TRẠNG THÁI HIỆN TẠI
- **Trạng thái Audit:** ĐÃ HOÀN TẤT 100%. Toàn bộ 9 mục yêu cầu của bạn đã được phân tích thấu đáo kèm bằng chứng mã nguồn thực tế.
- **Cam kết an toàn:** Chưa có bất kỳ dòng code backend, frontend hay database nào bị thay đổi.
- **Tài liệu đã cập nhật:** `docs/ORDERS_AUDIT.md`.
- **Bước tiếp theo:** Dừng lại chờ bạn xem xét, đánh giá và phê duyệt bản thiết kế trước khi tiến hành viết code!
