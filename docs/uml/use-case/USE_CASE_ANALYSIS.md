# TÀI LIỆU PHÂN TÍCH USE CASE HỆ THỐNG AURALIÈ HAUTE COUTURE
## PHÂN HỆ: KHÁCH HÀNG & MUA SẮM TRỰC TUYẾN (CUSTOMER STOREFRONT)
**Mã Sơ Đồ:** `UC01_CUSTOMER_STOREFRONT`  
**Phương Pháp Thực Hiện:** Reverse Engineering từ Source Code thực tế (Node.js Express + SQL Server + Vite Frontend)  
**Tiêu Chuẩn Tuân Thủ:** UML 2.x (OMG Unified Modeling Language Specification)  
**Quy Chuẩn Thiết Kế:** Đơn sắc Đen - Trắng (Monochrome Black & White)  
**Ngày Lập:** 21/11/2026  

---

## 1. DANH SÁCH TÁC NHÂN (ACTORS)

Dựa trên kiểm tra thực tế cấu trúc xác thực JWT (`backend/src/middlewares/auth.middleware.js`), bảng `roles` và bảng `users` trong CSDL SQL Server:

| STT | Tên Tác Nhân (Actor) | Loại Tác Nhân | Mô Tả & Quyền Hạn Trong Hệ Thống | Bằng Chứng Source Code |
|:---:|:---|:---:|:---|:---|
| 1 | **Khách Hàng Chưa Đăng Nhập**<br>*(Guest / Visitor)* | Primary Actor | Người dùng vãng lai truy cập website. Có quyền duyệt danh mục, tìm kiếm, xem chi tiết sản phẩm, tra cứu bảng size, xem đánh giá, quản lý giỏ hàng tạm, đọc blog, gửi form liên hệ và đăng ký/đăng nhập. | `frontend/index.html`<br>`frontend/collections.html`<br>`frontend/js/app.js` |
| 2 | **Khách Hàng Đã Đăng Nhập**<br>*(Registered Customer / VIP)* | Primary Actor<br>*(Thừa kế từ Guest)* | Khách hàng đã có tài khoản và đăng nhập thành công với vai trò `role_id = 2` (`CUSTOMER`). Kế thừa toàn bộ quyền của Guest, đồng thời có thêm quyền: Đặt hàng thanh toán, Quản lý Wishlist cá nhân, Quản lý hồ sơ, Tra cứu lịch sử đơn, Hủy đơn PENDING, Đánh giá sản phẩm đã mua và Tra cứu thẻ bảo hành 12 tháng. | `backend/src/modules/auth/auth.service.js`<br>`backend/src/middlewares/auth.middleware.js`<br>`frontend/profile.html` |
| 3 | **Hệ Thống Thanh Toán SePay**<br>*(SePay Payment Gateway)* | Secondary Actor<br>*(External System)* | Hệ thống cổng thanh toán quét mã VietQR Napas 24/7 bên ngoài. Tương tác với hệ thống qua cơ chế Webhook thời gian thực để tự động xác nhận giao dịch chuyển khoản thành công. | `backend/src/modules/orders/orders.routes.js`<br>`POST /api/v1/sepay/webhook` |

> **Quy ước kế thừa (Generalization):**  
> `Khách Hàng Đã Đăng Nhập` --▷ `Khách Hàng Chưa Đăng Nhập`  
> Quan hệ kế thừa thể hiện nguyên lý *Liskov Substitution Principle* trong UML: Bất kỳ Use Case nào Khách Hàng Chưa Đăng Nhập thực hiện được thì Khách Hàng Đã Đăng Nhập đều thực hiện được.

---

## 2. DANH SÁCH & ĐẶC TẢ CHI TIẾT CÁC USE CASE

### Nhóm 1: Khám Phá & Duyệt Sản Phẩm (Catalog & Discovery)

#### UC01: Duyệt Danh Mục Sản Phẩm (Browse Catalog)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Người dùng duyệt danh sách sản phẩm thời trang cao cấp được phân theo các danh mục: Áo Vest & Blazer, Váy & Đầm Dạ Hội, Áo Khoác Thu Đông, Túi Xách Da Cao Cấp, Giày & Phụ Kiện.
* **Tiền điều kiện:** Không có.
* **Hậu điều kiện:** Dữ liệu sản phẩm hiển thị trên lưới sản phẩm (`#product-grid-container`).

#### UC02: Tìm Kiếm & Lọc Nâng Cao (Search & Advanced Filters)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Tìm kiếm sản phẩm theo từ khóa (có cơ chế debounce) kết hợp lọc đa tiêu chí: danh mục, kích cỡ (S, M, L, XL, EU 35-43, Petite, Classic), màu sắc và khoảng giá.
* **Tiền điều kiện:** Người dùng nhập từ khóa hoặc chọn filter.
* **Hậu điều kiện:** Lưới sản phẩm cập nhật kết quả lọc theo thời gian thực; hệ thống Tracking ghi nhận sự kiện tìm kiếm.

#### UC03: Xem Chi Tiết Sản Phẩm (View Product QuickView)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Mở modal xem thông số kỹ thuật sản phẩm: hình ảnh thu phóng, chất liệu vải (Cashmere, lụa Cupro), phom dáng (European Tailored Fit), xuất xứ, giá niêm yết, chọn màu sắc và số lượng.
* **Quan hệ:** `<<extend>>` bởi UC04 (Tra Cứu Bảng Size May Đo).

#### UC04: Tra Cứu Bảng Size May Đo (View Size Guide)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Mở modal Bảng Size may đo riêng biệt cho từng mặt hàng (Túi xách: Petite/Classic/Grand Tote; Giày: 35-43 EU; Đầm dạ hội: XS-L đo 3 vòng; Áo Vest: S-XL). Khách có thể click chọn size trực tiếp trong bảng đo để áp dụng vào sản phẩm đang xem.
* **Quan hệ:** `<<extend>>` Use Case cơ sở UC03 (Xem Chi Tiết Sản Phẩm). Điểm mở rộng (Extension Point): Khách bấm nút `"Bảng Size"` cạnh khu vực chọn kích cỡ.

#### UC05: Xem Đánh Giá & Số Sao (View Product Reviews)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xem số sao trung bình (1-5 sao) và các nhận xét kiểm duyệt từ khách hàng mua trước được tải trực tiếp từ bảng `product_reviews` trong CSDL SQL Server.

#### UC06: Khám Phá Tạp Chí Thời Trang (Read Blog Editorial)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Đọc các ấn phẩm tạp chí thời trang Haute Couture, hướng dẫn phối đồ và nghệ thuật cắt may Bespoke.

#### UC07: Trò Chuyện Với AI Stylist (Chat With AI Stylist)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Khách hàng mở widget chat AI Stylist để được tư vấn phong cách trang phục phù hợp với vóc dáng, sự kiện dạ tiệc hoặc mùa thời trang.

---

### Nhóm 2: Giỏ Hàng & Thanh Toán (Cart & Checkout)

#### UC08: Quản Lý Giỏ Hàng (Manage Shopping Cart)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Thêm sản phẩm vào giỏ, xem danh sách giỏ hàng tại `cart.html`, tăng/giảm số lượng may đo, xóa từng món hoặc xóa sạch giỏ hàng. Số lượng tự động cập nhật badge icon giỏ hàng trên thanh điều hướng.

#### UC09: Đặt Hàng & Thanh Toán (Place Order & Checkout)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Tiến hành đặt hàng từ giỏ hàng. Hệ thống tạo mã đơn `AUR-XXXXXX`, thực thi SQL Transaction lưu vào bảng `orders` và `order_items`, đồng thời trừ số lượng tồn kho sản phẩm.
* **Quan hệ:**
  * `<<include>>` UC10: Xác Thực Thông Tin Giao Nhận (Bắt buộc).
  * `<<extend>>` UC11: Áp Dụng Mã Ưu Đãi (Khi khách nhập mã hợp lệ).
  * `<<extend>>` UC12: Thanh Toán QR SePay (Khi khách chọn phương thức chuyển khoản QR).
  * `<<extend>>` UC13: Thanh Toán COD (Khi khách chọn phương thức trả tiền mặt khi nhận).

#### UC10: Xác Thực Thông Tin Giao Nhận (Validate Shipping Info)
* **Actor:** Được gọi nội bộ trong quy trình đặt hàng.
* **Mô tả:** Kiểm tra tính hợp lệ của Họ tên người nhận, Số điện thoại Việt Nam (10 số), Địa chỉ giao hàng chi tiết, và Tùy chọn phương thức vận chuyển (Giao Hỏa Tốc 2h hoặc Giao Tiêu Chuẩn).
* **Quan hệ:** `<<include>>` vào UC09 (Đặt Hàng & Thanh Toán).

#### UC11: Áp Dụng Mã Ưu Đãi (Apply Coupon / Voucher)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Nhập mã giảm giá (ví dụ: `AURALIE2026`). Hệ thống kiểm tra hạn sử dụng, số lượng còn lại và tính toán lại tổng tiền thanh toán.
* **Quan hệ:** `<<extend>>` UC09. Điểm mở rộng: Khách nhập mã và nhấn `"Áp Dụng"`.

#### UC12: Thanh Toán Chuyển Khoản QR SePay (Pay Via Dynamic VietQR)
* **Actor:** Khách Hàng Đã Đăng Nhập, Hệ Thống Thanh Toán SePay.
* **Mô tả:** Sinh mã VietQR động chuẩn Napas 24/7 chứa chính xác số tiền và mã đơn. Khách quét mã chuyển tiền qua App ngân hàng. SePay Webhook tự động gọi API hệ thống để chuyển trạng thái đơn sang `PAID` trong vòng 3 giây.
* **Quan hệ:** `<<extend>>` UC09.

#### UC13: Thanh Toán Tiền Mặt Khi Nhận - COD (Cash On Delivery)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xác nhận hình thức nhận hàng thử đồ tại nhà rồi thanh toán tiền mặt trực tiếp cho chuyên viên Shipper Concierge. Trạng thái khởi tạo: `PENDING`.
* **Quan hệ:** `<<extend>>` UC09.

---

### Nhóm 3: Danh Sách Yêu Thích & Tương Tác (Wishlist & Engagement)

#### UC14: Quản Lý Danh Sách Yêu Thích (Manage Wishlist)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Bấm nút trái tim tại trang chi tiết hoặc thẻ sản phẩm: biểu tượng chuyển màu đỏ rực, lưu vào bảng `wishlists` qua API `POST /api/v1/wishlist`. Truy cập `wishlist.html` để xem lại, chọn kích cỡ chuyển sang giỏ hàng hoặc xóa khỏi danh sách.

#### UC15: Gửi Yêu Cầu Tư Vấn May Đo (Submit Bespoke Inquiry)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Nhập form liên hệ đặt lịch tư vấn cắt may thủ công tại Atelier AURALIÈ Đồng Khởi.

#### UC16: Đăng Ký Nhận Bản Tin VIP (Subscribe Newsletter)
* **Actor:** Khách Hàng Chưa Đăng Nhập, Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Nhập email để nhận thông báo ra mắt Bộ sưu tập mới và đặc quyền ưu đãi dành cho giới tinh hoa.

---

### Nhóm 4: Tài Khoản & Định Danh (Authentication & Security)

#### UC17: Đăng Ký Tài Khoản (Register Account)
* **Actor:** Khách Hàng Chưa Đăng Nhập.
* **Mô tả:** Nhập họ tên, email, mật khẩu (mã hóa bcrypt salt=12), số điện thoại để khởi tạo tài khoản hội viên AURALIÈ.

#### UC18: Đăng Nhập Hệ Thống (Login)
* **Actor:** Khách Hàng Chưa Đăng Nhập.
* **Mô tả:** Xác thực email và mật khẩu, nhận mã thông báo Bearer JWT Token để truy cập các tính năng cá nhân hóa.

#### UC19: Quên & Đặt Lại Mật Khẩu (Password Recovery)
* **Actor:** Khách Hàng Chưa Đăng Nhập.
* **Mô tả:** Gửi yêu cầu cấp lại mật khẩu qua email xác nhận mã token bảo mật.

#### UC20: Đăng Xuất (Logout)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Hủy phiên làm việc, xóa JWT token khỏi sessionStorage và điều hướng về trang chủ.

---

### Nhóm 5: Hồ Sơ Cá Nhân & Đơn Hàng (Customer Profile & Orders)

#### UC21: Quản Lý Thông Tin Cá Nhân (Manage Profile)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xem và cập nhật số điện thoại, địa chỉ nhận hàng mặc định tại `profile.html`.

#### UC22: Tra Cứu Lịch Sử Đơn Hàng (View Order History)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xem danh sách các đơn hàng đã đặt, mã đơn, ngày đặt, danh sách sản phẩm may đo, tổng tiền và tiến độ vận chuyển (`PENDING` $	o$ `CONFIRMED` $	o$ `PACKED` $	o$ `SHIPPING` $	o$ `DELIVERED`).

#### UC23: Hủy Đơn Hàng Chờ Xử Lý (Cancel Pending Order)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Khách hàng chủ động hủy đơn hàng nếu đơn vẫn đang ở trạng thái `PENDING` (chưa duyệt xuất kho đóng gói).
* **Quan hệ:** `<<extend>>` UC22 (Tra Cứu Lịch Sử Đơn Hàng). Điều kiện mở rộng: `order.status == 'PENDING'`.

#### UC24: Viết Đánh Giá Sản Phẩm Đã Mua (Submit Product Review)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Chấm số sao (1-5 sao) và viết cảm nhận trải nghiệm sản phẩm may đo sau khi nhận hàng thành công.

#### UC25: Tra Cứu Điểm & Hạng Thành Viên VIP (View VIP Tier & Points)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xem tổng tích lũy chi tiêu `total_spent`, điểm thưởng `vip_points`, và cấp độ thẻ hội viên: Silver VIP, Gold VIP, Platinum VIP, Haute VIP.

#### UC26: Tra Cứu Thẻ Bảo Hành Phom Dáng (View Digital Warranty)
* **Actor:** Khách Hàng Đã Đăng Nhập.
* **Mô tả:** Xem thông tin kích hoạt gói bảo hành phom dáng 12 tháng điện tử cho các thiết bị may đo cao cấp.

---

## 3. TỔNG HỢP MỐI QUAN HỆ UML 2.X TRONG SƠ ĐỒ

### A. Quan hệ Kế Thừa (Generalization)
* `Khách Hàng Đã Đăng Nhập` --▷ `Khách Hàng Chưa Đăng Nhập` (Actor Inheritance).

### B. Quan hệ Bao Hàm (Include - Bắt buộc)
* `UC09 (Đặt Hàng & Thanh Toán)` -.-> `«include»` .-> `UC10 (Xác Thực Thông Tin Giao Nhận)`:
  * *Ý nghĩa:* Bất kỳ lần đặt hàng nào cũng bắt buộc phải qua bước xác thực thông tin nhận hàng trước khi ghi vào CSDL. Mũi tên nét đứt hướng từ UC09 sang UC10.

### C. Quan hệ Mở Rộng (Extend - Có điều kiện)
* `UC04 (Tra Cứu Bảng Size May Đo)` -.-> `«extend»` .-> `UC03 (Xem Chi Tiết Sản Phẩm)`:
  * *Ý nghĩa:* Chỉ kích hoạt khi khách hàng click vào nút `"Bảng Size"`. Mũi tên nét đứt hướng từ UC04 về Use Case cơ sở UC03.
* `UC11 (Áp Dụng Mã Ưu Đãi)` -.-> `«extend»` .-> `UC09 (Đặt Hàng & Thanh Toán)`:
  * *Ý nghĩa:* Chỉ kích hoạt khi khách hàng có mã coupon và chọn áp dụng. Mũi tên hướng từ UC11 về UC09.
* `UC12 (Thanh Toán Chuyển Khoản QR SePay)` -.-> `«extend»` .-> `UC09 (Đặt Hàng & Thanh Toán)`:
  * *Ý nghĩa:* Chỉ kích hoạt khi khách chọn phương thức thanh toán QR động. Mũi tên hướng từ UC12 về UC09.
* `UC13 (Thanh Toán Tiền Mặt COD)` -.-> `«extend»` .-> `UC09 (Đặt Hàng & Thanh Toán)`:
  * *Ý nghĩa:* Kích hoạt khi khách chọn phương thức COD. Mũi tên hướng từ UC13 về UC09.
* `UC23 (Hủy Đơn Hàng Chờ Xử Lý)` -.-> `«extend»` .-> `UC22 (Tra Cứu Lịch Sử Đơn Hàng)`:
  * *Ý nghĩa:* Chỉ khả dụng khi đơn hàng ở trạng thái `PENDING`. Mũi tên hướng từ UC23 về UC22.