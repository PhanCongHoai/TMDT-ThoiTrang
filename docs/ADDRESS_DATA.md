# Danh sách địa chỉ giao hàng

File `frontend/assets/vn-addresses.json` là bản chụp danh sách tỉnh/thành phố và phường/xã, tải ngày 15/11/2026 từ:

- https://provinces.open-api.vn/api/v2/?depth=2
- Tài liệu và nguồn cung cấp: https://provinces.open-api.vn/

Dữ liệu được lưu thành file tĩnh, không đưa vào SQL Server và không gọi dịch vụ ngoài khi người dùng nhập địa chỉ. Muốn cập nhật danh mục thì tải lại file từ nguồn và xác minh cấu trúc trước khi thay thế.

Tên đường do người dùng nhập; gợi ý tên đường lấy từ các địa chỉ đã lưu trên cùng trình duyệt, cùng tỉnh và phường/xã. Không coi đây là danh sách đầy đủ đường phố.

Giỏ hàng lưu lựa chọn từng dòng trong trình duyệt. Nút thanh toán mở `checkout.html`, nơi chọn người nhận và hiển thị đồng thời ba thẻ phương thức thanh toán như giao diện gốc. Khi chưa có địa chỉ, người dùng nhập ngay trên trang thanh toán. Phiên thanh toán lưu sản phẩm, mã ưu đãi và phương thức thanh toán trong sessionStorage theo tài khoản; sửa địa chỉ xong quay lại trang thanh toán, không tự tạo đơn. Các bài kiểm tra giao diện dùng API giả lập, không tạo đơn trong DB.
