# TỔNG HỢP HIỆN TRẠNG DỰ ÁN AURALIÈ HAUTE COUTURE

Ngày rà soát: **13/11/2026**. Phạm vi: thư mục dự án hiện tại, gồm mã nguồn, SQL, tài liệu, cấu hình, dữ liệu mẫu, bộ kiểm thử và nội dung chữ trong PowerPoint.

**Cách hiểu báo cáo:** “Có mã xử lý” nghĩa là tìm thấy phần triển khai trong file; không đồng nghĩa đã chạy thành công trên máy này. Danh sách DB được xác định từ SQL và truy vấn trong mã nguồn, **chưa kết nối SQL Server để xác nhận các bảng đang tồn tại thực tế**. Không chạy migration, không sửa mã nghiệp vụ, không chạy các bài kiểm thử có ghi dữ liệu.

## Mục lục

1. [Dự án hiện có những gì?](#1-dự-án-hiện-có-những-gì)
2. [Các trang giao diện](#2-các-trang-giao-diện)
3. [Chức năng theo nhóm người dùng](#3-chức-năng-theo-nhóm-người-dùng)
4. [Các bảng cơ sở dữ liệu](#4-các-bảng-cơ-sở-dữ-liệu)
5. [Luồng hoạt động chính](#5-luồng-hoạt-động-chính)
6. [Những phần còn thiếu hoặc đang mô phỏng](#6-những-phần-còn-thiếu-hoặc-đang-mô-phỏng)
7. [Cấu hình, cách chạy và kiểm thử hiện có](#7-cấu-hình-cách-chạy-và-kiểm-thử-hiện-có)
8. [Danh sách API lấy từ mã nguồn](#8-danh-sách-api-lấy-từ-mã-nguồn)
9. [Danh mục toàn bộ file ban đầu](#9-danh-mục-toàn-bộ-file-ban-đầu)

## 1. Dự án hiện có những gì?

Đây là website thương mại điện tử bán thời trang cao cấp thương hiệu **AURALIÈ Haute Couture**, có trang khách hàng, trang quản trị, xử lý đơn hàng/thanh toán, theo dõi hành vi và dịch vụ dự báo nhu cầu sản phẩm.

Tại thời điểm bắt đầu rà soát có **133 file**, gồm 125 file văn bản/mã nguồn/cấu hình, 7 ảnh JPG và 1 PowerPoint. File báo cáo này được tạo thêm sau khi kiểm kê.

| Khu vực | Nội dung | Công nghệ / vai trò |
|---|---|---|
| `frontend/` | 15 trang HTML, CSS, JavaScript, ảnh, cấu hình Vite | HTML/CSS/JavaScript thuần; không thấy React/Vue/Angular |
| `backend/` | REST API, xác thực, nghiệp vụ bán hàng, tracking, analytics, tác vụ nền, kiểm thử | Node.js, Express 4, thư viện `mssql` kết nối SQL Server |
| `database/` | Schema, dữ liệu mẫu, script SQL Server, migration và rollback | 18 bảng gốc và 12 bảng bổ sung |
| `ai-service/` | API huấn luyện, dự đoán, đánh giá mô hình | Python, FastAPI, pandas, NumPy, scikit-learn, LightGBM, XGBoost, pyodbc |
| `docs/` | 18 tài liệu kiến trúc, API, DB, thanh toán, bảo mật, kiểm thử, kiểm toán | Có cả tài liệu lịch sử/đề xuất; một số nội dung không còn khớp code |
| File gốc | README, cấu hình npm, lockfile, script tunnel, PowerPoint | Điều phối frontend/backend và tài liệu thuyết trình |

Kiến trúc thực tế:

```text
Trình duyệt: frontend, cổng 3000 khi phát triển
       |
       | /api được Vite chuyển tiếp
       v
Backend Node.js/Express, cổng 5000 mặc định
       |                           |
       | truy vấn SQL              | gọi API nội bộ
       v                           v
SQL Server                   Python/FastAPI, cổng 8000
AURALIE_FashionDB                   |
       ^___________________________|
                    pyodbc
```

Backend được chia thành **14 module**: `auth`, `products`, `categories`, `orders`, `reviews`, `coupons`, `users`, `wishlist`, `blogs`, `inquiries`, `admin`, `ai`, `tracking`, `analytics`. Một số module có controller/service/repository riêng; một số vẫn viết nghiệp vụ trực tiếp trong file routes.

## 2. Các trang giao diện

| File trong `frontend/` | Mục đích |
|---|---|
| `index.html` | Trang chủ, danh mục sản phẩm, tìm kiếm, xem nhanh sản phẩm, đánh giá, các widget mua sắm |
| `collections.html` | Bộ sưu tập/lookbook, lọc bộ sưu tập và xem chi tiết dạng modal |
| `about.html` | Giới thiệu thương hiệu |
| `contact.html` | Liên hệ, yêu cầu tư vấn/đặt lịch |
| `cart.html` | Giỏ hàng, mã giảm giá, thông tin giao hàng, chọn thanh toán |
| `wishlist.html` | Danh sách sản phẩm yêu thích |
| `login.html` | Đăng nhập và đăng ký |
| `profile.html` | Hồ sơ cá nhân, đơn hàng của tôi, thông tin địa chỉ |
| `admin.html` | Quản trị sản phẩm, đơn hàng, đánh giá, khách hàng, thống kê, hành vi và dự báo AI |
| `blog.html` | Danh sách bài tạp chí thời trang, lọc theo nhóm |
| `blog-detail.html` | Hiển thị nội dung bài viết được chọn |
| `warranty-policy.html` | Chính sách bảo hành |
| `return-policy.html` | Chính sách đổi trả |
| `shipping-policy.html` | Chính sách vận chuyển |
| `privacy-policy.html` | Chính sách quyền riêng tư |

Chi tiết sản phẩm và checkout được xử lý trong các trang/modal hiện có; không thấy file trang riêng `product-detail.html` hoặc `checkout.html`.

`frontend/js/app.js` tập trung phần lớn tương tác khách hàng. `frontend/admin.html` chứa nhiều JavaScript quản trị ngay trong HTML. `frontend/js/api/client.js` và `frontend/js/auth.js` hỗ trợ gọi API, gắn JWT và quản lý phiên. Thư mục `frontend/js/services/tracking/` có 7 file chuyên trách tracking.

## 3. Chức năng theo nhóm người dùng

### 3.1. Khách truy cập và khách mua hàng

| Nhóm | Chức năng tìm thấy | Mức triển khai và giới hạn |
|---|---|---|
| Xem sản phẩm | Danh sách, tìm kiếm tên/mô tả, lọc danh mục và tag | Có API truy vấn DB; một số lựa chọn giao diện như size/màu chỉ có thao tác chọn, không phải bộ lọc backend đầy đủ |
| Chi tiết sản phẩm | Thông tin chất liệu, phom, xuất xứ, ảnh, biến thể, tồn kho | Có API chi tiết; modal frontend còn kết hợp dữ liệu trình bày mẫu |
| Chọn size | Bảng size và gợi ý size theo thông tin nhập | Logic giao diện; không phải mô hình ML đo cơ thể |
| Giỏ hàng | Thêm, xóa, đổi số lượng, tính tạm tính | Giỏ chính lưu `localStorage` với khóa `auralie_cart`; có đồng bộ phục vụ giỏ bỏ quên |
| Mã giảm giá | Tra mã và xem số tiền giảm | Có API; lúc tạo đơn backend kiểm tra lại điều kiện và tính tiền từ DB |
| Đặt hàng | Nhập thông tin, tạo đơn, lưu chi tiết, giữ/trừ tồn kho | Có transaction SQL cho thao tác tạo đơn và cập nhật kho |
| COD | Đặt hàng trả tiền khi nhận | Có nhánh nghiệp vụ; đơn mới `CONFIRMED`, thanh toán `UNPAID` |
| SePay QR | Sinh URL VietQR, hiển thị thông tin ngân hàng, kiểm tra thanh toán | Có backend webhook/polling; cần cấu hình dịch vụ và xác nhận giao dịch thật |
| VISA | Có lựa chọn trên giao diện và backend | Hiện tự đánh dấu `PAID`; xem giới hạn ở mục 6 |
| Tra cứu đơn | Tra bằng mã đơn, xem tình trạng và thông tin vận chuyển | Có API đọc DB; thông tin hãng/mã vận chuyển có phần tự sinh hoặc cố định |
| Đánh giá | Xem điểm sao, viết nhận xét, thông tin biến thể | Có API lưu DB; chưa xác minh người viết thực sự mua hàng |
| Blog | Xem danh sách, lọc nhóm và đọc bài | Backend có API danh sách; trang chi tiết lấy bài từ danh sách |
| Liên hệ/đặt lịch | Gửi yêu cầu tư vấn | Có route nhưng thiếu SQL tạo bảng `contact_inquiries` trong bản mã hiện tại |
| Newsletter | Đăng ký email nhận tin | Có route nhưng thiếu SQL tạo bảng `newsletter_subscribers`; chưa thấy luồng gửi bản tin |
| Chat tư vấn | Widget chat, gợi ý phối đồ/size/ưu đãi, tùy trình duyệt có nhận giọng nói | Trả lời bằng luật/từ khóa, nội dung mẫu; không phải LLM |
| Tìm kiếm bằng ảnh | Chọn ảnh và hiển thị gợi ý | Mô phỏng; chưa trích xuất đặc trưng hay đối sánh ảnh thật |
| Giỏ bỏ quên | Thông báo nhắc quay lại giỏ, đồng bộ thông tin giỏ | Có nhắc trên giao diện và lưu DB; chưa thấy gửi email tự động |

### 3.2. Tài khoản khách hàng

- Đăng ký tài khoản, kiểm tra email trùng, băm mật khẩu bằng bcrypt.
- Đăng nhập, cấp JWT, lấy thông tin tài khoản hiện tại và đổi mật khẩu qua API.
- Đọc/cập nhật họ tên, số điện thoại, địa chỉ của chính mình.
- Lấy thông tin giao hàng đã lưu để điền checkout.
- Xem danh sách và chi tiết đơn hàng cá nhân; có xử lý kiểm tra sở hữu khi đọc chi tiết.
- Yêu cầu hủy đơn ở những trạng thái được phép và hoàn lại tồn kho; còn thiếu kiểm tra người dùng ở nhánh không đăng nhập, xem mục 6.
- Thêm, xem, xóa sản phẩm yêu thích; API yêu cầu đăng nhập.
- Hiển thị hạng VIP, điểm và tổng chi tiêu đang lưu trong `users`. Chưa thấy quy trình tự động tích điểm/thăng hạng khi hoàn tất đơn.

JWT và thông tin phiên chính nằm trong `sessionStorage`; tên/vai trò/email cache và giỏ hàng có dùng `localStorage`. Vai trò lưu ở trình duyệt phục vụ giao diện; các API quản trị có middleware kiểm tra JWT/quyền ADMIN.

### 3.3. Quản trị viên

| Nhóm | Phần đã có mã xử lý | Giới hạn |
|---|---|---|
| Dashboard | Tổng giá trị đơn, số đơn, số sản phẩm đang bán, số tài khoản, điểm đánh giá và nhóm danh mục | Tổng doanh thu ở `/admin/stats` cộng mọi đơn, chưa lọc đơn hủy/chưa thanh toán; biểu đồ doanh thu 12 tháng/tỷ lệ danh mục dùng mảng mẫu |
| Sản phẩm | Xem, thêm sản phẩm, ngừng bán bằng `is_active = 0` | Chưa có API sửa sản phẩm; thêm sản phẩm chưa đồng thời tạo biến thể/ảnh |
| Danh mục | Xem danh mục và số sản phẩm | Chưa có API thêm/sửa/xóa danh mục |
| Đơn hàng | Danh sách phân trang, tìm kiếm/lọc, xem chi tiết, đổi trạng thái, hủy và quét đơn hết hạn | Giao diện chưa nối đầy đủ mọi khả năng lọc/phân trang của API; có chỗ quy tắc hủy chưa thống nhất |
| Giao dịch | API liệt kê lịch sử giao dịch có phân trang | Có bảng `payment_transactions`; không đồng nghĩa đã có đối soát ngân hàng đầy đủ |
| Đánh giá | Xem, đánh dấu đã xác minh, xóa | “Duyệt” chỉ cập nhật `is_verified_buyer`; không có luồng duyệt xuất bản riêng |
| Khách hàng | Xem danh sách, hạng VIP, điểm, tổng chi tiêu | Chưa có API quản lý vai trò, khóa/xóa tài khoản |
| Nhập hàng theo lô | API ghi và xem lịch sử `inventory_imports` | Chưa cộng tồn kho biến thể; frontend gọi sai URL |
| Liên hệ và bản tin | API xem yêu cầu tư vấn và danh sách email | Phụ thuộc 2 bảng chưa có script tạo |
| Xuất dữ liệu | Giao diện xuất CSV và hiển thị hóa đơn | CSV có dữ liệu dự phòng mẫu; phần hóa đơn là giao diện xem/in, cần phân biệt với file PDF kế toán hoàn chỉnh |
| Analytics | Tổng quan truy cập, funnel, từ khóa, sản phẩm tương tác, hành trình khách | Có truy vấn tổng hợp; một số chỉ số là phép ước lượng, không phải phân tích cohort/phễu tuần tự đầy đủ |
| AI dự báo | Xem dự báo 7/14/30 ngày, hàng có nguy cơ thiếu, lịch sử mô hình, sai số, cảnh báo | Phụ thuộc migration, dữ liệu lịch sử và dịch vụ Python |
| Vòng đời mô hình | Chạy tổng hợp, dự đoán, huấn luyện, đánh giá và chọn lại phiên bản cũ | Có API yêu cầu ADMIN; chưa có sẵn file mô hình đã huấn luyện trong thư mục |

### 3.4. Theo dõi hành vi và dự báo nhu cầu

Tracking có định danh ẩn danh, phiên truy cập, heartbeat, hàng đợi gửi sự kiện theo lô, chống ghi trùng `event_id`, bản ghi lựa chọn đồng ý/từ chối và bộ lọc một số trường nhạy cảm. Các nhóm sự kiện gồm lượt xem trang/sản phẩm, tìm kiếm, giỏ hàng, wishlist, checkout, tài khoản và marketing.

Danh sách sự kiện backend cho phép không có nghĩa mọi sự kiện đều đã được phát đầy đủ từ giao diện. Module tracking hiện được nhúng ở 6 trang: `index.html`, `collections.html`, `cart.html`, `login.html`, `profile.html`, `wishlist.html`. Cơ chế đồng ý hiện theo hướng **cho phép trước, dừng khi từ chối**; không nên mô tả là chỉ theo dõi sau khi đồng ý.

Dịch vụ Python có mã xử lý thực tế cho dự báo:

- Đọc doanh số hợp lệ, tương tác sản phẩm và lịch sử tồn kho từ SQL Server.
- Tạo đặc trưng về doanh số trễ, trung bình 7/14/30 ngày, lượt xem, thêm giỏ, tồn kho, giá, lịch và danh mục.
- Dự báo tổng nhu cầu cho **7, 14 và 30 ngày**, xu hướng tăng/giảm, lượng đề xuất nhập và rủi ro thiếu hàng.
- Sử dụng **Moving Average Baseline** khi thiếu lịch sử; cấu hình mặc định cần ít nhất 30 ngày lịch sử có bán và 60 mẫu hợp lệ để xét huấn luyện ML.
- Huấn luyện LightGBM, so sánh với XGBoost và baseline; chia dữ liệu theo thời gian thành train/validation/test.
- Lưu phiên bản, artifact `.joblib`, log và chỉ số MAE, RMSE, WAPE, bias; có điều kiện lựa chọn mô hình production.
- Đối chiếu dự báo với số bán thực tế khi kỳ dự báo kết thúc; tạo cảnh báo drift và hỗ trợ huấn luyện lại.

Khoảng “confidence” trong dự báo hiện được tính theo biên cố định khoảng ±20% hoặc tối thiểu ±1; chưa phải khoảng tin cậy thống kê được hiệu chỉnh. Chưa có bằng chứng trong thư mục rằng mô hình đã được huấn luyện hay đạt một độ chính xác cụ thể.

## 4. Các bảng cơ sở dữ liệu

### 4.1. DB nào đang được mã nguồn sử dụng?

Backend thực tế dùng **Microsoft SQL Server**, mặc định tên DB **`AURALIE_FashionDB`**, cổng **1433**. File quyết định kết nối là `backend/src/config/db.js`; dịch vụ AI dùng `ai-service/app/db.py`.

`database/schema.sql` được ghi chú dùng PostgreSQL/MySQL, nhưng cú pháp như `SERIAL` và `REFERENCES` nghiêng về PostgreSQL; không nên coi đây là script chạy trực tiếp cho mọi hệ quản trị. Backend hiện không có adapter PostgreSQL/MySQL.

**Số bảng theo source:** 18 bảng gốc trong `sqlserver_setup.sql` + 12 bảng mới trong migration ngày 12/11/2026 = **30 bảng có định nghĩa CREATE TABLE riêng biệt**. `schema.sql` lặp lại 18 tên gốc, không cộng thêm 18 bảng nữa. Ngoài ra có **2 tên bảng được backend truy vấn nhưng chưa có DDL trong bộ SQL**, nên tổng tên bảng nghiệp vụ nhận diện là **32**. Chưa xác nhận số bảng trong DB đang chạy.

### 4.2. 18 bảng gốc

| STT | Bảng | Lưu dữ liệu gì? | Liên kết chính / tình trạng sử dụng |
|---|---|---|---|
| 1 | `roles` | Tên vai trò ADMIN/CUSTOMER | Một vai trò có nhiều `users` |
| 2 | `users` | Tài khoản, mật khẩu băm, liên hệ, địa chỉ, hạng VIP, điểm và tổng chi tiêu | Liên kết `roles`, đơn hàng và wishlist |
| 3 | `categories` | Danh mục: tên, slug, mô tả | Một danh mục có nhiều sản phẩm |
| 4 | `products` | Sản phẩm, giá gốc, tag, chất liệu, phom, xuất xứ, trạng thái kinh doanh | Thuộc danh mục; có ảnh, biến thể, đánh giá |
| 5 | `product_variants` | Size, màu, SKU, giá biến thể và tồn kho | Thuộc sản phẩm; liên kết chi tiết đơn |
| 6 | `product_images` | Đường dẫn ảnh và cờ ảnh đại diện | Thuộc sản phẩm |
| 7 | `orders` | Mã đơn, tổng tiền, giảm giá, phí ship, địa chỉ, điện thoại, thanh toán, trạng thái, mã vận đơn | Khách vãng lai có thể có `user_id = NULL` |
| 8 | `order_items` | Sản phẩm/biến thể trong đơn, số lượng, đơn giá và snapshot sau migration | Thuộc đơn; tham chiếu biến thể |
| 9 | `coupons` | Mã giảm giá, loại/mức giảm, đơn tối thiểu, trần giảm, giới hạn lượt và ngày hết hạn | Được dùng khi tính đơn; `orders` chưa có cột FK coupon trong schema hiện tại |
| 10 | `product_reviews` | Tên/email người viết, sao, nhận xét, biến thể, ảnh, phản hồi admin và cờ xác minh | Thuộc sản phẩm; không có FK người dùng/đơn mua để xác minh người mua |
| 11 | `wishlists` | Các sản phẩm được người dùng yêu thích | Cặp `user_id` + `product_id` duy nhất |
| 12 | `blogs` | Tiêu đề, slug, nhóm, tóm tắt, nội dung, ảnh bìa và tác giả | Có API đọc danh sách |
| 13 | `ai_chat_sessions` | Phiên chat: mã, người dùng, kênh, trạng thái | Có schema và seed; route chat hiện không ghi vào đây |
| 14 | `ai_chat_messages` | Tin nhắn, người gửi, nội dung/đính kèm, ý định | Tham chiếu phiên chat; chưa nối lưu hội thoại thực tế |
| 15 | `ai_image_embeddings` | Ảnh, vector JSON, nhãn phân loại và điểm tin cậy | Có schema/seed; endpoint tìm ảnh chưa truy vấn/đối sánh bảng này |
| 16 | `abandoned_carts` | Giỏ bỏ quên dạng JSON, email, thời gian nhắc, coupon đề nghị, trạng thái | Tracking tái sử dụng; migration thêm định danh ẩn danh/phiên |
| 17 | `inventory_imports` | Mã lô, nhà cung cấp, lượng nhập, chi phí, người nhập, ghi chú | Là nhật ký tổng hợp, không có chi tiết mặt hàng/biến thể của lô |
| 18 | `payment_transactions` | Mã giao dịch duy nhất, đơn hàng, phương thức, số tiền, mã phản hồi và trạng thái | Nhiều giao dịch có thể thuộc một đơn |

### 4.3. 12 bảng bổ sung tracking và AI

Nguồn: `database/migrations/20261112_behavior_and_ai_forecasting.sql`.

| STT | Bảng | Mục đích | Khóa / liên kết đáng chú ý |
|---|---|---|---|
| 19 | `tracking_consents` | Lịch sử đồng ý/từ chối theo dõi theo loại và phiên bản chính sách | `consent_id`; có `user_id`, `anonymous_id` |
| 20 | `user_sessions` | Phiên truy cập, thời gian, thiết bị, referrer, nguồn/UTM | PK `session_id`; người dùng có thể chưa đăng nhập |
| 21 | `user_events` | Nhật ký sự kiện, trang, sản phẩm, thiết bị và thuộc tính JSON | PK `id`, UNIQUE `event_id`; FK tới phiên/người dùng/sản phẩm/danh mục |
| 22 | `user_search_history` | Từ khóa, số kết quả, bộ lọc và sản phẩm được click | PK `search_id`; có người dùng, phiên, định danh ẩn danh |
| 23 | `product_interactions` | Chi tiết tương tác sản phẩm: xem, click, chọn biến thể, thêm giỏ… | PK `interaction_id`; có product/variant/session |
| 24 | `user_behavior_daily` | Tổng hợp theo người/định danh và ngày | UNIQUE `behavior_date` + `actor_key` |
| 25 | `ProductDailyMetrics` | Lượt xem, thêm giỏ, wishlist, doanh số, doanh thu, chuyển đổi và tồn kho theo ngày | UNIQUE `product_id` + `metric_date` |
| 26 | `ProductInventorySnapshots` | Ảnh chụp tồn kho của sản phẩm theo ngày | UNIQUE `product_id` + `snapshot_date` |
| 27 | `MLModelVersions` | Phiên bản mô hình, loại, thời gian, metrics, schema đặc trưng, đường dẫn artifact và cờ production | UNIQUE `model_version`; liên hệ với dự báo/log bằng chuỗi phiên bản, không phải FK |
| 28 | `MLTrainingLogs` | Mỗi lần huấn luyện/đánh giá, trigger, trạng thái, cỡ dữ liệu và sai số | UNIQUE `run_id` |
| 29 | `ProductForecasts` | Dự báo nhu cầu, khoảng ước lượng, xu hướng, nhập thêm, rủi ro và thực tế đối chiếu | UNIQUE sản phẩm + ngày gốc + kỳ hạn |
| 30 | `MLMonitoringAlerts` | Cảnh báo mô hình/dữ liệu, mức độ và xử lý | Có product/model nhưng không khai báo FK cho hai trường này |

### 4.4. Hai bảng có trong truy vấn nhưng thiếu script tạo

| Tên bảng | Chức năng phụ thuộc | Cột được truy vấn/ghi trong code |
|---|---|---|
| `contact_inquiries` | Gửi yêu cầu tư vấn/đặt lịch và admin xem yêu cầu | `full_name`, `email`, `phone`, `service`, `message`, `status`, `created_at` |
| `newsletter_subscribers` | Đăng ký bản tin và admin xem danh sách | `id`, `email`, `name`, `is_active`, `subscribed_at` |

Chưa thể khẳng định cấu trúc đầy đủ hay khóa của hai bảng này. Nếu khởi tạo DB chỉ bằng bộ SQL đang có, các API tương ứng chưa có đủ bảng để hoạt động.

### 4.5. Migration và quan hệ dữ liệu

- Migration `20261105_add_order_items_snapshot.sql` thêm `product_name`, `sku`, `size`, `color` vào `order_items` và backfill dữ liệu cũ. Backend hiện ghi/đọc trực tiếp 4 cột này, nên cần áp dụng migration cho DB mới trước khi dùng đơn hàng.
- Migration `20261112_behavior_and_ai_forecasting.sql` tạo 12 bảng mới, thêm `anonymous_id`, `session_id` cho `abandoned_carts` và cho phép email giỏ hàng NULL.
- Có file rollback của migration tracking/AI. Rollback xóa các bảng bổ sung nên sẽ mất dữ liệu trong những bảng đó; đây không phải script dùng để xem thông tin.
- `sqlserver_setup.sql` có phần DROP 18 bảng gốc rồi tạo lại/nạp seed. Không chạy lại vào DB có dữ liệu cần giữ.

```text
roles ──< users ──< orders ──< order_items >── product_variants >── products
            |         |                                            |
            |         └──< payment_transactions                     ├──< product_images
            └──< wishlists >────────────────────────────────────────┤
                                                                   ├──< product_reviews
categories ──< products                                            ├──< ProductDailyMetrics
                                                                   ├──< ProductInventorySnapshots
users ──< user_sessions ──< user_events                             └──< ProductForecasts
```

Ký hiệu `──<` nghĩa là một bản ghi bên trái có thể có nhiều bản ghi bên phải. Sơ đồ chỉ thể hiện các quan hệ chính; danh sách cột phía dưới lấy từ DDL.

### 4.6. Danh sách cột của 30 bảng theo SQL Server

Đây là tên cột theo script, đã cộng các cột migration; không phải kết quả đọc schema trực tiếp từ SQL Server. PK = khóa chính, FK = khóa ngoại. Chi tiết kiểu dữ liệu, DEFAULT, CHECK, UNIQUE và hành vi xóa xem file SQL nguồn.

| Bảng | PK | Các cột sau migration | FK khai báo |
|---|---|---|---|
| `roles` | `id` | `id`, `role_name` | Không khai báo |
| `users` | `id` | `id`, `full_name`, `email`, `password_hash`, `phone`, `address`, `role_id`, `vip_tier`, `vip_points`, `total_spent`, `created_at` | role_id → roles.id |
| `categories` | `id` | `id`, `name`, `slug`, `description` | Không khai báo |
| `products` | `id` | `id`, `name`, `slug`, `description`, `base_price`, `category_id`, `tag`, `material`, `fit`, `lining`, `hardware`, `origin`, `is_active`, `created_at` | category_id → categories.id |
| `product_variants` | `id` | `id`, `product_id`, `size`, `color`, `stock_quantity`, `variant_price`, `sku` | product_id → products.id |
| `product_images` | `id` | `id`, `product_id`, `image_url`, `is_thumbnail` | product_id → products.id |
| `orders` | `id` | `id`, `user_id`, `order_code`, `total_amount`, `discount_amount`, `shipping_fee`, `shipping_address`, `phone_number`, `payment_method`, `payment_status`, `tracking_code`, `status`, `created_at` | user_id → users.id |
| `order_items` | `id` | `id`, `order_id`, `variant_id`, `quantity`, `price`, `product_name`, `sku`, `size`, `color` | order_id → orders.id; variant_id → product_variants.id |
| `coupons` | `id` | `id`, `code`, `discount_type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `usage_limit`, `used_count`, `expiry_date`, `is_active` | Không khai báo |
| `product_reviews` | `id` | `id`, `product_id`, `user_name`, `user_email`, `rating`, `comment`, `variant_info`, `image_url`, `admin_reply`, `is_verified_buyer`, `helpful_count`, `created_at` | product_id → products.id |
| `wishlists` | `id` | `id`, `user_id`, `product_id`, `created_at` | user_id → users.id; product_id → products.id |
| `blogs` | `id` | `id`, `title`, `slug`, `category`, `summary`, `content`, `cover_image`, `author_name`, `published_at` | Không khai báo |
| `ai_chat_sessions` | `id` | `id`, `session_code`, `user_id`, `channel`, `status`, `created_at`, `updated_at` | user_id → users.id |
| `ai_chat_messages` | `id` | `id`, `session_id`, `sender_type`, `message_text`, `attachment_type`, `attachment_url`, `intent_detected`, `created_at` | session_id → ai_chat_sessions.id |
| `ai_image_embeddings` | `id` | `id`, `product_id`, `image_url`, `feature_vector_json`, `detected_category`, `confidence_score`, `indexed_at` | product_id → products.id |
| `abandoned_carts` | `id` | `id`, `user_id`, `user_email`, `cart_data_json`, `abandoned_at`, `reminder_sent_count`, `last_notified_at`, `coupon_code_offered`, `status`, `anonymous_id`, `session_id` | user_id → users.id |
| `inventory_imports` | `id` | `id`, `batch_code`, `supplier_name`, `total_quantity`, `total_cost`, `imported_by`, `notes`, `created_at` | Không khai báo |
| `payment_transactions` | `id` | `id`, `transaction_code`, `order_id`, `payment_method`, `amount`, `gateway_response_code`, `status`, `paid_at` | order_id → orders.id |
| `tracking_consents` | `consent_id` | `consent_id`, `user_id`, `anonymous_id`, `consent_type`, `consent_status`, `consent_timestamp`, `policy_version` | user_id → users.id |
| `user_sessions` | `session_id` | `session_id`, `user_id`, `anonymous_id`, `started_at`, `last_activity_at`, `ended_at`, `landing_page`, `referrer`, `device_type`, `browser`, `operating_system`, `traffic_source`, `utm_source`, `utm_medium`, `utm_campaign` | user_id → users.id |
| `user_events` | `id` | `id`, `event_id`, `event_name`, `user_id`, `anonymous_id`, `session_id`, `product_id`, `category_id`, `event_timestamp`, `page_url`, `referrer_url`, `device_type`, `browser`, `operating_system`, `event_properties`, `created_at` | user_id → users.id; session_id → user_sessions.session_id; product_id → products.id; category_id → categories.id |
| `user_search_history` | `search_id` | `search_id`, `user_id`, `anonymous_id`, `session_id`, `keyword`, `result_count`, `clicked_product_id`, `filters_json`, `created_at` | user_id → users.id; clicked_product_id → products.id |
| `product_interactions` | `interaction_id` | `interaction_id`, `user_id`, `anonymous_id`, `session_id`, `product_id`, `variant_id`, `interaction_type`, `interaction_value`, `created_at` | user_id → users.id; product_id → products.id |
| `user_behavior_daily` | `id` | `id`, `behavior_date`, `actor_key`, `user_id`, `anonymous_id`, `total_product_views`, `total_searches`, `total_cart_adds`, `total_wishlist_adds`, `total_purchases`, `total_orders`, `total_spent`, `updated_at` | Không khai báo |
| `ProductDailyMetrics` | `id` | `id`, `product_id`, `metric_date`, `total_views`, `unique_viewers`, `total_searches_clicked`, `total_cart_adds`, `total_wishlist_adds`, `total_orders`, `total_units_sold`, `total_revenue`, `conversion_rate`, `current_price`, `stock_quantity`, `is_out_of_stock`, `trend_anomaly_flag`, `created_at`, `updated_at` | product_id → products.id |
| `ProductInventorySnapshots` | `id` | `id`, `product_id`, `snapshot_date`, `stock_quantity`, `is_out_of_stock`, `created_at` | product_id → products.id |
| `MLModelVersions` | `id` | `id`, `model_version`, `model_type`, `horizon_days`, `training_date`, `dataset_start_date`, `dataset_end_date`, `hyperparameters_json`, `train_metrics_json`, `val_metrics_json`, `test_metrics_json`, `feature_schema_json`, `artifact_path`, `status`, `is_production`, `notes`, `created_at`, `updated_at` | Không khai báo |
| `MLTrainingLogs` | `id` | `id`, `run_id`, `trigger_type`, `model_version`, `status`, `dataset_rows`, `mae`, `rmse`, `wape`, `forecast_bias`, `baseline_mae`, `promoted`, `message`, `started_at`, `finished_at` | Không khai báo |
| `ProductForecasts` | `id` | `id`, `product_id`, `forecast_base_date`, `horizon_days`, `target_date_end`, `predicted_quantity`, `confidence_low`, `confidence_high`, `trend_direction`, `growth_rate_percent`, `recommended_restock_qty`, `low_stock_risk`, `model_version`, `actual_quantity`, `abs_error`, `evaluated_at`, `created_at`, `updated_at` | product_id → products.id |
| `MLMonitoringAlerts` | `id` | `id`, `alert_type`, `severity`, `product_id`, `model_version`, `metric_value`, `threshold_value`, `message`, `is_resolved`, `created_at`, `resolved_at` | Không khai báo |

### 4.7. Dữ liệu mẫu có sẵn

`sqlserver_setup.sql` vừa tạo DB/bảng vừa chèn dữ liệu mẫu. `seed.sql` là bộ dữ liệu cho schema theo hướng PostgreSQL; hai file không hoàn toàn giống nhau. Không gộp chúng thành một tập dữ liệu đang vận hành.

| Bảng | Số dòng seed trong `sqlserver_setup.sql` |
|---|---:|
| `roles` | 2 |
| `users` | 5 |
| `categories` | 5 |
| `products` | 20 |
| `product_variants` | 14 |
| `product_images` | 6 |
| `orders` | 4 |
| `order_items` | 4 |
| `coupons` | 4 |
| `product_reviews` | 5 |
| `wishlists` | 4 |
| `blogs` | 6 |
| `ai_chat_sessions` | 1 |
| `ai_chat_messages` | 2 |
| `ai_image_embeddings` | 2 |
| `abandoned_carts` | 1 |
| `inventory_imports` | 3 |
| `payment_transactions` | 3 |

Nhóm sản phẩm mẫu gồm vest/blazer, váy/đầm dạ hội, áo khoác thu đông, túi xách và giày/phụ kiện. Có mã ưu đãi mẫu như `AURALIE2026`, `WELCOME10`, `FREESHIPLUX`. Số lượng trên là số dòng khai báo trong script, không phải số dòng trong DB thực tế hiện tại.

## 5. Luồng hoạt động chính

### 5.1. Mua hàng và thanh toán

1. Frontend đọc danh sách từ API sản phẩm, người dùng chọn hàng và lưu giỏ tại trình duyệt.
2. Khi đặt hàng, frontend gửi mặt hàng, thông tin giao hàng, phương thức và mã coupon.
3. Backend tra lại sản phẩm/biến thể, lấy giá từ DB, kiểm tra tồn và điều kiện giảm giá; phí giao hàng trong service hiện đặt bằng 0.
4. Transaction tạo `orders`, trừ tồn `product_variants`, ghi `order_items` kèm snapshot và tăng lượt coupon.
5. COD tạo đơn `CONFIRMED/UNPAID`; SePay tạo `PENDING/UNPAID`; VISA hiện được đánh dấu `CONFIRMED/PAID` ngay.
6. Với SePay, frontend hiển thị QR và đọc trạng thái; webhook ghi `payment_transactions`, cộng số tiền đã thanh toán thành công và chuyển trạng thái theo đủ/thiếu/thừa tiền.
7. Có xử lý trùng mã giao dịch, tiền tới sau khi hủy và tiền gửi thêm cho đơn đã thanh toán. Hoàn tiền thực tế chưa có tích hợp tự động.
8. Worker quét mỗi 60 giây, hủy và hoàn kho các đơn SePay `PENDING/UNPAID` quá 15 phút. Đơn `PARTIALLY_PAID` không thuộc điều kiện quét này.

Luồng trạng thái chính trong state machine: `PENDING → CONFIRMED → PROCESSING → SHIPPED → COMPLETED`; có nhánh `CANCELLED`. Trạng thái thanh toán tách riêng: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `REFUNDED`.

### 5.2. Thu thập hành vi → dự báo

1. Trình duyệt tạo định danh ẩn danh và phiên, ghi nhận sự kiện và gửi lô lên `/api/tracking`.
2. Backend kiểm tra định dạng, danh sách sự kiện, lựa chọn tracking, trường nhạy cảm và sự kiện trùng.
3. Dữ liệu được ghi vào bảng phiên/sự kiện và một số bảng lịch sử tìm kiếm/tương tác.
4. Scheduler backend tổng hợp số liệu ngày, snapshot tồn và hành vi khách; kiểm tra xu hướng bất thường.
5. Python đọc dữ liệu để dự báo bằng baseline hoặc mô hình production, ghi `ProductForecasts`.
6. Admin đọc kết quả dự báo và metrics qua backend; đánh giá dự báo đã hết kỳ để theo dõi sai số.

Scheduler vòng đời ML kiểm tra mỗi 6 giờ: dự đoán tối đa một lần/ngày trong một tiến trình, đánh giá vào thứ Hai, xét huấn luyện ngày 1 hàng tháng và xét huấn luyện sớm khi có drift. Bộ nhớ lịch chạy nằm trong tiến trình, nên khởi động lại server có thể chạy lại cùng kỳ.

## 6. Những phần còn thiếu hoặc đang mô phỏng

Các điểm sau được đối chiếu từ mã nguồn hiện có, giúp đọc đúng mức độ hoàn thiện. Đây không phải kết quả kiểm toán bảo mật toàn diện hay kiểm thử vận hành.

| Phần | Hiện trạng xác định từ code | File đối chiếu |
|---|---|---|
| DB của form liên hệ/bản tin | Có INSERT/SELECT nhưng không tìm thấy CREATE TABLE trong 6 file SQL | `backend/src/modules/inquiries/inquiries.routes.js`, `database/` |
| Chatbot | Backend dùng `includes()` và phản hồi viết sẵn; widget frontend còn tự tạo phản hồi bằng `setTimeout` | `backend/src/modules/ai/ai.routes.js`, `frontend/js/app.js` |
| Lưu lịch sử chat | Có bảng và seed; route chat không INSERT phiên/tin nhắn | Cùng file route AI |
| Tìm ảnh | Endpoint trả nhãn/sản phẩm/độ tương đồng cố định; frontend hiện hiệu ứng chờ rồi mở kết quả mẫu | Cùng file route AI và `frontend/js/app.js` |
| VISA | Tạo đơn với VISA tự đặt `payment_status = PAID`, không thấy xác nhận từ cổng thẻ | `backend/src/modules/orders/orders.service.js` |
| Tên VNPAY trong tài liệu | Code QR/webhook hiện dùng SePay; không thấy bộ tích hợp cổng VNPAY thật | `orders.service.js`, `orders.routes.js`; README/PowerPoint có nội dung cũ |
| Nhập kho frontend | Gọi `/api/v1/inventory/batch-import`; route thực tế là `/api/v1/admin/inventory/batch-import` | `frontend/admin.html`, `backend/src/modules/admin/admin.routes.js` |
| Tăng tồn khi nhập lô | API chỉ INSERT `inventory_imports`, chưa UPDATE `product_variants.stock_quantity` | `backend/src/modules/admin/admin.routes.js` |
| Thêm sản phẩm | Chỉ thêm `products`, chưa tạo ảnh và biến thể đi kèm; chưa có API sửa | Module `products` |
| Mặt hàng không khớp biến thể | Repository có nhánh fallback trả biến thể NULL/tồn giả định 999; việc giữ kho chỉ áp dụng khi có `variant_id` | `backend/src/modules/orders/orders.repository.js` |
| Verified Buyer | POST đánh giá không bắt buộc JWT và mặc định `is_verified_buyer = 1`; chưa đối chiếu đơn mua | `reviews.routes.js`, `reviews.repository.js` |
| Phản hồi admin cho đánh giá | Có cột `admin_reply`, nhưng chưa có route cập nhật phản hồi | Module `reviews` |
| VIP và số đo may đo | Có cột/hiển thị VIP; chưa thấy tự tích điểm/thăng hạng; không có schema số đo cơ thể tương ứng nội dung PowerPoint | `users`, `orders`, schema và PowerPoint |
| Doanh thu dashboard | `/admin/stats` cộng cả đơn hủy/chưa thu tiền; biểu đồ 12 tháng và tỷ lệ danh mục dùng dữ liệu cố định | `admin.routes.js`, `frontend/admin.html` |
| Vận chuyển | Mã vận đơn được tự sinh; tên hãng và một số nội dung hiển thị cố định; chưa thấy API đồng bộ GHN/GHTK/Viettel Post | `orders.service.js`, `frontend/js/app.js` |
| Email marketing | Có khai báo thư viện `nodemailer`, nhưng chưa thấy luồng gửi email bản tin/nhắc giỏ tự động trong source | `backend/package.json`, `backend/src/` |
| Hủy đơn không đăng nhập | Route dùng `optionalAuth`; service chỉ kiểm tra sở hữu trong nhánh có user, chưa xác minh ở nhánh không có user | `orders.routes.js`, `orders.service.js` |
| Hủy đơn đã giao | State machine cho phép `SHIPPED → CANCELLED`, nhưng repository hoàn kho lại chặn đơn `SHIPPED` | `orders.state-machine.js`, `orders.repository.js` |
| Xác thực webhook khi thiếu cấu hình | Khi `SEPAY_API_KEY` rỗng, `authenticateSepayWebhook()` trả true; không phải luôn chặn webhook không có khóa | `orders.service.js` |
| Coupon xem trước | `/coupons/apply` chưa kiểm tra hết hạn/lượt dùng đầy đủ; bước tạo đơn có kiểm tra lại | `coupons.routes.js`, `orders.service.js` |
| Cột tổng hợp hành vi | `user_behavior_daily` có `total_orders`, `total_spent` nhưng truy vấn tổng hợp hiện chưa cập nhật hai cột này | Migration và `analytics.service.js` |
| Artifact AI | Chưa có `.joblib` hay thư mục artifact được huấn luyện trong bản kiểm kê ban đầu | `ai-service/` |
| Thư viện/môi trường | Không có `node_modules`, `.env` thật, môi trường Python ảo hay `cloudflared.exe` trong thư mục ban đầu | Danh mục file thực tế |
| Tài liệu nghiệm thu | Có báo cáo ghi đã pass/ready for production, nhưng có nội dung không khớp hiện tại; không dùng làm bằng chứng rằng bản đang xem đã được chạy thành công | `docs/`, `backend/test/verification_results.json`, PowerPoint |

## 7. Cấu hình, cách chạy và kiểm thử hiện có

### 7.1. Cấu hình

Có `backend/.env.example` và `ai-service/.env.example`. Nhóm cấu hình gồm kết nối DB, JWT, môi trường/cổng backend, ngân hàng/khóa SePay, địa chỉ và khóa API AI, ODBC và ngưỡng huấn luyện. Source có một số giá trị mặc định trong file config; báo cáo không chép lại mật khẩu/khóa.

Các cổng mặc định: frontend **3000**, backend **5000**, AI **8000**, SQL Server **1433**. Chạy file HTML trực tiếp không tương đương chạy qua Vite: các URL `/api` cần proxy hoặc máy chủ phục vụ phù hợp.

### 7.2. Lệnh đã được khai báo

Các lệnh dưới đây là hướng dẫn đọc từ cấu hình, **chưa được thực thi trong đợt rà soát này**. Cần SQL Server và schema/migration phù hợp trước khi kiểm tra nghiệp vụ.

```powershell
# Tại thư mục gốc: cài phụ thuộc npm cho cả dự án
npm run install:all

# Chạy frontend và backend cùng lúc
npm run dev

# Chỉ build frontend
npm run build --prefix frontend

# Dịch vụ Python cần chạy riêng
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Lệnh `npm start`/`npm run dev` ở gốc chỉ chạy frontend và backend, **không tự chạy Python hoặc SQL Server**. Script `tunnel`/`share` và `start-tunnel.bat` tham chiếu `cloudflared.exe`, nhưng file thực thi này chưa có trong thư mục.

### 7.3. Kiểm thử và tài liệu

| File | Mục đích |
|---|---|
| `backend/test/master.test.js` | State machine, giá/đơn hàng, quyền truy cập, tranh chấp tồn kho và coupon; là script chạy bởi `npm test` trong backend |
| `backend/test/full_verification.test.js` | Xác minh snapshot, webhook, rollback và tình huống đồng thời |
| `backend/test/tracking_and_ai.test.js` | 6 nhóm kiểm tra tracking, trùng sự kiện, lọc trường nhạy cảm, consent, aggregation, forecast/model và quyền ADMIN |
| `backend/test/inspect_schema.js` | Đọc cấu trúc DB phục vụ kiểm tra |
| `backend/test/test_migration.js`, `backend/test/run_20261112_migration.js` | Script liên quan thực thi/kiểm tra migration, có thể thay đổi DB |
| `backend/test/verification_results.json` | 19 kết quả đã lưu đều ghi PASS; là dữ liệu kiểm thử lịch sử, không phải kết quả chạy hiện tại |
| `docs/TESTING_GUIDE.md` | Hướng dẫn kiểm tra cú pháp, build và kiểm thử thủ công/tự động |
| `Bao_Cao_Web_Auralie_Haute_Couture.pptx` | Bản trình bày 16 slide về đề tài, kiến trúc, DB, chức năng, AI, quản trị, kiểm thử và hướng phát triển |

Không chạy test tích hợp trong lượt này vì yêu cầu là lập danh sách hiện trạng; các test có tạo đơn, cập nhật kho, coupon hoặc dữ liệu tracking. Không xác nhận lại các kết quả PASS hay số liệu hiệu năng trong tài liệu cũ.

## 8. Danh sách API lấy từ mã nguồn

Các route dưới đây được trích từ khai báo thực tế. Khi có hai tiền tố, cùng router được đăng ký tại cả hai đường dẫn. Đây là danh mục route, không phải xác nhận mọi endpoint đã vận hành thành công. Quyền truy cập chi tiết nằm ở middleware và controller/service; riêng analytics/AI quản trị được bảo vệ toàn router bằng JWT + ADMIN.

Đếm từ khai báo: **68 route backend** (gồm health), tương ứng **84 cặp phương thức/URL** vì router analytics có hai tiền tố; thêm **7 route Python**. Con số 41 endpoint trong một số tài liệu là danh mục cũ.

`GET /api/health`: kiểm tra API và truy vấn đếm sản phẩm trong DB.

### Module `auth`

Nguồn: `backend/src/modules/auth/auth.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| GET | `/api/v1/auth/me` |
| PUT | `/api/v1/auth/change-password` |

### Module `products`

Nguồn: `backend/src/modules/products/products.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/products` |
| GET | `/api/v1/products/:id` |
| POST | `/api/v1/products` |
| DELETE | `/api/v1/products/:id` |

### Module `categories`

Nguồn: `backend/src/modules/categories/categories.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/categories` |

### Module `orders`

Nguồn: `backend/src/modules/orders/orders.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/orders/my-orders` |
| GET | `/api/v1/orders/transactions` |
| GET | `/api/v1/orders/:id` |
| POST | `/api/v1/orders` |
| GET | `/api/v1/orders/:orderCode/payment-status` |
| GET | `/api/v1/orders/track/:code` |
| POST | `/api/v1/orders/:id/cancel` |
| GET | `/api/v1/sepay/config` |
| POST | `/api/v1/sepay/webhook` |
| POST | `/api/v1/sepay/simulate-payment` |
| GET | `/api/v1/orders` |
| PUT | `/api/v1/orders/:id/status` |
| POST | `/api/v1/orders/cleanup-expired` |

### Module `reviews`

Nguồn: `backend/src/modules/reviews/reviews.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/products/:id/reviews` |
| POST | `/api/v1/reviews` |
| GET | `/api/v1/admin/reviews` |
| PUT | `/api/v1/reviews/:id/approve` |
| DELETE | `/api/v1/reviews/:id` |

### Module `coupons`

Nguồn: `backend/src/modules/coupons/coupons.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| POST | `/api/v1/coupons/apply` |

### Module `users`

Nguồn: `backend/src/modules/users/users.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/users/profile` |
| PUT | `/api/v1/users/profile` |
| GET | `/api/v1/users/shipping-info` |
| GET | `/api/v1/users` |

### Module `wishlist`

Nguồn: `backend/src/modules/wishlist/wishlist.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/wishlist` |
| POST | `/api/v1/wishlist` |
| DELETE | `/api/v1/wishlist/:productId` |

### Module `blogs`

Nguồn: `backend/src/modules/blogs/blogs.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/blogs` |

### Module `inquiries`

Nguồn: `backend/src/modules/inquiries/inquiries.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| POST | `/api/v1/contact` |
| GET | `/api/v1/admin/inquiries` |
| POST | `/api/v1/newsletter/subscribe` |
| GET | `/api/v1/admin/newsletter-subscribers` |

### Module `admin`

Nguồn: `backend/src/modules/admin/admin.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/v1/admin/stats` |
| GET | `/api/v1/admin/inventory/batches` |
| POST | `/api/v1/admin/inventory/batch-import` |

### Module `ai`

Nguồn: `backend/src/modules/ai/ai.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| POST | `/api/v1/ai/chat` |
| POST | `/api/v1/ai/search-image` |

### Module `tracking`

Nguồn: `backend/src/modules/tracking/tracking.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| POST | `/api/tracking/consent` |
| POST | `/api/tracking/session/start` |
| POST | `/api/tracking/session/heartbeat` |
| POST | `/api/tracking/events` |
| POST | `/api/tracking/events/batch` |
| POST | `/api/tracking/cart-sync` |

### Module `analytics`

Nguồn: `backend/src/modules/analytics/analytics.routes.js`.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/api/admin/analytics/overview`<br>`/api/v1/admin/analytics/overview` |
| GET | `/api/admin/analytics/conversion-funnel`<br>`/api/v1/admin/analytics/conversion-funnel` |
| GET | `/api/admin/analytics/search`<br>`/api/v1/admin/analytics/search` |
| GET | `/api/admin/analytics/top-products`<br>`/api/v1/admin/analytics/top-products` |
| GET | `/api/admin/analytics/product/:id`<br>`/api/v1/admin/analytics/product/:id` |
| GET | `/api/admin/analytics/customer/:id`<br>`/api/v1/admin/analytics/customer/:id` |
| GET | `/api/admin/ai/forecast`<br>`/api/v1/admin/ai/forecast` |
| GET | `/api/admin/ai/top-predicted-products`<br>`/api/v1/admin/ai/top-predicted-products` |
| GET | `/api/admin/ai/product/:id/forecast`<br>`/api/v1/admin/ai/product/:id/forecast` |
| GET | `/api/admin/ai/low-stock-risk`<br>`/api/v1/admin/ai/low-stock-risk` |
| GET | `/api/admin/ai/model-performance`<br>`/api/v1/admin/ai/model-performance` |
| POST | `/api/admin/ai/model/rollback`<br>`/api/v1/admin/ai/model/rollback` |
| POST | `/api/admin/ai/run-aggregation`<br>`/api/v1/admin/ai/run-aggregation` |
| POST | `/api/admin/ai/trigger-predict`<br>`/api/v1/admin/ai/trigger-predict` |
| POST | `/api/admin/ai/trigger-train`<br>`/api/v1/admin/ai/trigger-train` |
| POST | `/api/admin/ai/trigger-evaluate`<br>`/api/v1/admin/ai/trigger-evaluate` |

### Dịch vụ Python/FastAPI

Chạy trên cổng 8000 mặc định; các route `/api/ml/*` yêu cầu header `X-Internal-API-Key`. `/health` không yêu cầu khóa.

| Phương thức | Đường dẫn |
|---|---|
| GET | `/health` |
| POST | `/api/ml/train` |
| POST | `/api/ml/predict` |
| POST | `/api/ml/evaluate` |
| GET | `/api/ml/forecast` |
| GET | `/api/ml/model/metrics` |
| GET | `/api/ml/model/status` |

## 9. Danh mục toàn bộ file ban đầu

Danh mục gồm **133 file có trước khi tạo báo cáo**, dùng đường dẫn tương đối tính từ thư mục gốc. File lock được đọc như dữ liệu phụ thuộc; ảnh JPG được kiểm kê như tài nguyên nhị phân; PowerPoint được trích nội dung chữ của 16 slide, không đánh giá bố cục trình chiếu hay xác minh các tuyên bố trong slide.

| Khu vực | Số file ban đầu |
|---|---:|
| `(gốc)` | 6 |
| `ai-service` | 10 |
| `backend` | 57 |
| `database` | 7 |
| `docs` | 18 |
| `frontend` | 35 |

### (gốc)

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `.gitignore` | Loại trừ phụ thuộc, file môi trường, build, log và công cụ tunnel khỏi Git. |
| `Bao_Cao_Web_Auralie_Haute_Couture.pptx` | Báo cáo thuyết trình 16 slide; có tuyên bố tính năng cần đối chiếu với code. |
| `package-lock.json` | Khóa phiên bản phụ thuộc npm; lockfileVersion 3. |
| `package.json` | Điều phối chạy/cài frontend và backend bằng concurrently; lệnh tunnel/share. |
| `README.md` | Giới thiệu và hướng dẫn gốc; một số cấu trúc/DB được mô tả theo phiên bản cũ. |
| `start-tunnel.bat` | Mở Cloudflare tunnel từ cổng 3000 bằng cloudflared.exe. |

### frontend

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `frontend/about.html` | Giới thiệu thương hiệu. |
| `frontend/admin.html` | Trang quản trị và JavaScript nghiệp vụ admin, analytics, AI. |
| `frontend/assets/card_1.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/card_2.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/card_3.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/card_4.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/card_5.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/card_6.jpg` | Ảnh thẻ sản phẩm/bộ sưu tập. |
| `frontend/assets/hero_banner.jpg` | Ảnh banner trang chủ. |
| `frontend/blog-detail.html` | Chi tiết bài viết. |
| `frontend/blog.html` | Danh sách tạp chí thời trang. |
| `frontend/cart.html` | Giỏ hàng và checkout. |
| `frontend/collections.html` | Bộ sưu tập/lookbook. |
| `frontend/contact.html` | Liên hệ và đăng ký tư vấn. |
| `frontend/css/styles.css` | Thiết kế giao diện, bố cục, responsive, thành phần và hiệu ứng. |
| `frontend/index.html` | Trang chủ và catalog sản phẩm. |
| `frontend/js/api/client.js` | HTTP client dùng chung, tự gắn JWT và xử lý phản hồi. |
| `frontend/js/app.js` | Logic chính giỏ hàng, catalog, modal, checkout, chat mẫu, ảnh mẫu và tương tác trang. |
| `frontend/js/auth.js` | Lưu/xóa phiên, gắn JWT, xác minh đăng nhập và guard. |
| `frontend/js/services/tracking/consentManager.js` | Lưu lựa chọn tracking và gửi consent lên backend. |
| `frontend/js/services/tracking/eventQueue.js` | Hàng đợi, gửi lô và flush sự kiện. |
| `frontend/js/services/tracking/eventTracker.js` | Tạo payload sự kiện, thông tin trang/thiết bị và chống gửi lặp phía client. |
| `frontend/js/services/tracking/identityManager.js` | Tạo/lấy định danh ẩn danh phía trình duyệt. |
| `frontend/js/services/tracking/sessionManager.js` | Quản lý phiên và heartbeat của người truy cập. |
| `frontend/js/services/tracking/trackingService.js` | Khởi tạo tracking, banner consent và đồng bộ giỏ. |
| `frontend/login.html` | Đăng nhập/đăng ký. |
| `frontend/package-lock.json` | Khóa phiên bản phụ thuộc npm; lockfileVersion 3. |
| `frontend/package.json` | Khai báo Vite, lệnh chạy, build và preview frontend. |
| `frontend/privacy-policy.html` | Chính sách quyền riêng tư. |
| `frontend/profile.html` | Hồ sơ, thông tin giao hàng và đơn hàng cá nhân. |
| `frontend/return-policy.html` | Chính sách đổi trả. |
| `frontend/shipping-policy.html` | Chính sách vận chuyển. |
| `frontend/vite.config.js` | Cổng/proxy API và 15 entry HTML khi build. |
| `frontend/warranty-policy.html` | Chính sách bảo hành. |
| `frontend/wishlist.html` | Danh sách yêu thích. |

### backend

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `backend/.env.example` | Mẫu cấu hình môi trường backend, DB, JWT, SePay và AI. |
| `backend/package-lock.json` | Khóa phiên bản phụ thuộc npm; lockfileVersion 3. |
| `backend/package.json` | Khai báo thư viện Express, SQL Server, JWT, bcrypt, bảo mật và lệnh backend. |
| `backend/src/app.js` | Khởi tạo Express, bảo mật, CORS, health check và đăng ký router. |
| `backend/src/config/db.js` | Cấu hình pool SQL Server và hàm truy vấn có tham số. |
| `backend/src/config/env.js` | Đọc các biến cấu hình backend, JWT, DB và SePay. |
| `backend/src/jobs/expiredOrders.job.js` | Worker quét đơn SePay hết hạn và gọi hoàn kho, mặc định mỗi 60 giây. |
| `backend/src/jobs/mlLifecycle.job.js` | Scheduler tổng hợp dữ liệu, dự báo, đánh giá và xét huấn luyện mô hình. |
| `backend/src/middleware/auth.js` | Bản middleware JWT/quyền cũ; các router hiện dùng thư mục middlewares. |
| `backend/src/middlewares/auth.middleware.js` | JWT bắt buộc/tùy chọn và kiểm tra quyền ADMIN dùng trong router. |
| `backend/src/middlewares/error.middleware.js` | Chuẩn hóa xử lý lỗi cuối chuỗi request. |
| `backend/src/middlewares/notFound.middleware.js` | Phản hồi đường dẫn API không tồn tại. |
| `backend/src/middlewares/rateLimit.middleware.js` | Giới hạn request chung và đăng nhập/đăng ký. |
| `backend/src/modules/admin/admin.routes.js` | Định tuyến API và middleware cho thống kê/nhật ký nhập lô. |
| `backend/src/modules/ai/ai.routes.js` | Định tuyến API và middleware cho chat và tìm ảnh mẫu. |
| `backend/src/modules/analytics/analytics.routes.js` | Định tuyến API và middleware cho phân tích và dự báo AI. |
| `backend/src/modules/analytics/analytics.service.js` | Xử lý nghiệp vụ cho phân tích và dự báo AI. |
| `backend/src/modules/auth/auth.controller.js` | Nhận request và trả response cho xác thực tài khoản. |
| `backend/src/modules/auth/auth.routes.js` | Định tuyến API và middleware cho xác thực tài khoản. |
| `backend/src/modules/auth/auth.service.js` | Xử lý nghiệp vụ cho xác thực tài khoản. |
| `backend/src/modules/auth/auth.validation.js` | Kiểm tra dữ liệu đầu vào cho xác thực tài khoản. |
| `backend/src/modules/blogs/blogs.routes.js` | Định tuyến API và middleware cho bài viết. |
| `backend/src/modules/categories/categories.routes.js` | Định tuyến API và middleware cho danh mục. |
| `backend/src/modules/coupons/coupons.routes.js` | Định tuyến API và middleware cho mã giảm giá. |
| `backend/src/modules/inquiries/inquiries.routes.js` | Định tuyến API và middleware cho liên hệ/bản tin. |
| `backend/src/modules/orders/orders.constants.js` | Hằng số trạng thái đơn/thanh toán, phương thức và thời gian giữ kho. |
| `backend/src/modules/orders/orders.controller.js` | Nhận request và trả response cho đơn hàng/thanh toán. |
| `backend/src/modules/orders/orders.repository.js` | Truy vấn và ghi cơ sở dữ liệu cho đơn hàng/thanh toán. |
| `backend/src/modules/orders/orders.routes.js` | Định tuyến API và middleware cho đơn hàng/thanh toán. |
| `backend/src/modules/orders/orders.service.js` | Xử lý nghiệp vụ cho đơn hàng/thanh toán. |
| `backend/src/modules/orders/orders.state-machine.js` | Ma trận chuyển trạng thái và ràng buộc thanh toán trước giao hàng. |
| `backend/src/modules/orders/orders.validation.js` | Kiểm tra dữ liệu đầu vào cho đơn hàng/thanh toán. |
| `backend/src/modules/products/products.controller.js` | Nhận request và trả response cho sản phẩm. |
| `backend/src/modules/products/products.repository.js` | Truy vấn và ghi cơ sở dữ liệu cho sản phẩm. |
| `backend/src/modules/products/products.routes.js` | Định tuyến API và middleware cho sản phẩm. |
| `backend/src/modules/products/products.service.js` | Xử lý nghiệp vụ cho sản phẩm. |
| `backend/src/modules/products/products.validation.js` | Kiểm tra dữ liệu đầu vào cho sản phẩm. |
| `backend/src/modules/reviews/reviews.controller.js` | Nhận request và trả response cho đánh giá. |
| `backend/src/modules/reviews/reviews.repository.js` | Truy vấn và ghi cơ sở dữ liệu cho đánh giá. |
| `backend/src/modules/reviews/reviews.routes.js` | Định tuyến API và middleware cho đánh giá. |
| `backend/src/modules/tracking/tracking.constants.js` | Danh sách sự kiện được nhận, khóa nhạy cảm và giới hạn batch. |
| `backend/src/modules/tracking/tracking.controller.js` | Nhận request và trả response cho theo dõi hành vi. |
| `backend/src/modules/tracking/tracking.repository.js` | Truy vấn và ghi cơ sở dữ liệu cho theo dõi hành vi. |
| `backend/src/modules/tracking/tracking.routes.js` | Định tuyến API và middleware cho theo dõi hành vi. |
| `backend/src/modules/tracking/tracking.service.js` | Xử lý nghiệp vụ cho theo dõi hành vi. |
| `backend/src/modules/users/users.routes.js` | Định tuyến API và middleware cho hồ sơ/khách hàng. |
| `backend/src/modules/wishlist/wishlist.routes.js` | Định tuyến API và middleware cho yêu thích. |
| `backend/src/server.js` | Mở cổng backend, khởi động tác vụ nền và xử lý lỗi tiến trình. |
| `backend/src/utils/logger.js` | Ghi log theo mức độ và môi trường. |
| `backend/src/utils/response.js` | Chuẩn hóa cấu trúc JSON phản hồi API. |
| `backend/test/full_verification.test.js` | Kiểm tra snapshot, SePay, rollback và các tình huống đồng thời. |
| `backend/test/inspect_schema.js` | Script khảo sát cấu trúc cơ sở dữ liệu. |
| `backend/test/master.test.js` | Bộ test mặc định: đơn hàng, phân quyền, tồn kho và coupon đồng thời. |
| `backend/test/run_20261112_migration.js` | Thực thi migration tracking và dự báo AI vào SQL Server. |
| `backend/test/test_migration.js` | Script kiểm tra/chạy migration snapshot, cần đọc trước khi chạy. |
| `backend/test/tracking_and_ai.test.js` | Kiểm tra tracking, consent, tổng hợp, dự báo và phân quyền. |
| `backend/test/verification_results.json` | 19 kết quả kiểm thử đã lưu, đều ghi PASS; không phải kết quả lượt này. |

### database

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `database/migrations/20261105_add_order_items_snapshot.sql` | Thêm và backfill 4 trường snapshot của chi tiết đơn. |
| `database/migrations/20261112_behavior_and_ai_forecasting.sql` | Tạo 12 bảng tracking/AI và mở rộng abandoned_carts. |
| `database/migrations/20261112_behavior_and_ai_forecasting_rollback.sql` | Gỡ các bảng/cột bổ sung của migration tracking/AI. |
| `database/README.md` | Giới thiệu cơ sở dữ liệu và cách sử dụng script. |
| `database/schema.sql` | Schema 18 bảng theo hướng PostgreSQL; không phải schema backend SQL Server đang dùng. |
| `database/seed.sql` | Dữ liệu mẫu cho schema SQL kiểu PostgreSQL. |
| `database/sqlserver_setup.sql` | Tạo DB SQL Server, DROP/tạo lại 18 bảng và nạp dữ liệu mẫu. |

### ai-service

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `ai-service/.env.example` | Mẫu cấu hình dịch vụ AI, SQL Server/ODBC và ngưỡng ML. |
| `ai-service/app/__init__.py` | Đánh dấu package Python. |
| `ai-service/app/config.py` | Đọc cấu hình AI, ngưỡng dữ liệu/drift và đường dẫn artifact. |
| `ai-service/app/db.py` | Chọn driver ODBC, mở kết nối SQL Server và quản lý cursor. |
| `ai-service/app/evaluator.py` | Đối chiếu dự báo đã hết kỳ với thực tế, tính sai số và cảnh báo drift. |
| `ai-service/app/features.py` | Đọc dữ liệu bán/hành vi/tồn và tạo đặc trưng chuỗi thời gian. |
| `ai-service/app/main.py` | FastAPI: health, train, predict, evaluate, forecast và model status/metrics. |
| `ai-service/app/trainer.py` | Baseline, huấn luyện/so sánh mô hình, lưu phiên bản và dự báo 7/14/30 ngày. |
| `ai-service/README.md` | Hướng dẫn cài/chạy API Python và endpoint chính. |
| `ai-service/requirements.txt` | Phụ thuộc Python của API, dữ liệu và mô hình ML. |

### docs

| Đường dẫn file | Nội dung / trách nhiệm |
|---|---|
| `docs/AI_DEMAND_FORECASTING_AUDIT.md` | PHASE 1: BÁO CÁO KIỂM TOÁN SOURCE CODE & DỮ LIỆU. |
| `docs/API_DOCUMENTATION.md` | TÀI LIỆU HỆ THỐNG RESTful API — AURALIÈ HAUTE COUTURE. |
| `docs/ARCHITECTURE.md` | KIẾN TRÚC HỆ THỐNG — AURALIÈ HAUTE COUTURE. |
| `docs/BACKEND_API_INVENTORY.md` | BACKEND API INVENTORY & REPOSITORY REFERENCE. |
| `docs/BEHAVIOR_TRACKING_AUDIT.md` | PHASE 1: BÁO CÁO KIỂM TOÁN SOURCE CODE & DATABASE. |
| `docs/CHANGELOG.md` | NHẬT KÝ THAY ĐỔI HỆ THỐNG (CHANGELOG). |
| `docs/DATABASE_SCHEMA.md` | TÀI LIỆU CẤU TRÚC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA). |
| `docs/DEPLOYMENT_GUIDE.md` | HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH (DEPLOYMENT & PRODUCTION GUIDE). |
| `docs/FINAL_ACCEPTANCE_AUDIT.md` | BÁO CÁO NGHIỆM THU KỸ THUẬT VÀ KIỂM TOÁN HỆ THỐNG CUỐI CÙNG. |
| `docs/FINAL_PROJECT_AUDIT.md` | BÁO CÁO KIỂM TOÁN TOÀN BỘ DỰ ÁN (FINAL PROJECT AUDIT). |
| `docs/KNOWN_ISSUES.md` | DANH SÁCH VẤN ĐỀ ĐÃ BIẾT & LƯU Ý VẬN HÀNH (KNOWN ISSUES & OPERATIONAL NOTES). |
| `docs/ORDER_STATUS_FLOW.md` | TÀI LIỆU QUY CHUẨN: BẢNG CHUYỂN TRẠNG THÁI ĐƠN HÀNG & THANH TOÁN. |
| `docs/ORDERS_AUDIT.md` | BÁO CÁO AUDIT CHUYÊN SÂU: NGHIỆP VỤ ORDERS & SEPAY PAYMENT. |
| `docs/PAYMENT_FLOW.md` | TÀI LIỆU THIẾT KẾ & VẬN HÀNH: LUỒNG THANH TOÁN TỔNG THỂ & SEPAY VIETQR. |
| `docs/PROJECT_ARCHITECTURE.md` | TÀI LIỆU KIẾN TRÚC HỆ THỐNG (PROJECT ARCHITECTURE). |
| `docs/SECURITY.md` | CHÍNH SÁCH BẢO MẬT & KIỂM SOÁT AN NINH — AURALIÈ. |
| `docs/SECURITY_AUDIT.md` | BÁO CÁO KIỂM TRA BẢO MẬT TOÀN HỆ THỐNG (SECURITY AUDIT). |
| `docs/TESTING_GUIDE.md` | HƯỚNG DẪN KIỂM THỬ HỆ THỐNG (TESTING GUIDE). |
