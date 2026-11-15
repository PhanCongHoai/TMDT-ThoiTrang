# Chạy dự án trên Windows

Chạy PowerShell tại thư mục gốc dự án. SQL Server phải đang chạy; cấu hình kết nối trong `backend/.env` và `ai-service/.env` phải trỏ cùng CSDL. `AI_INTERNAL_API_KEY` phải giống nhau ở hai file.

## Cài đặt lần đầu

```powershell
npm.cmd run install:all
python -m venv ai-service/.venv
.\ai-service\.venv\Scripts\python.exe -m pip install -r ai-service/requirements.txt
npm.cmd run db:migrate
```

Lệnh migration chỉ áp dụng các migration bổ sung, không chạy script reset CSDL `sqlserver_setup.sql`. Cần có CSDL gốc trước khi áp dụng migration.

## Khởi chạy

```powershell
npm.cmd run dev:all
```

- Website: http://localhost:3000
- Backend và CSDL: http://localhost:5000/api/health
- AI: http://127.0.0.1:8000/health

Nếu các dịch vụ đã chạy trong terminal khác, dừng chúng bằng Ctrl+C trước khi chạy lại để tránh trùng cổng. Giữ terminal chạy dịch vụ mở.

## Kiểm tra kết nối

Mở terminal khác:

```powershell
npm.cmd run check:connections
```

Lệnh này kiểm tra SQL Server, API bán hàng và quản trị qua proxy frontend, dịch vụ Python và truy vấn dự báo Python vào SQL Server. Không tạo đơn hàng, gửi email hoặc thực hiện thanh toán. Token kiểm tra quản trị chỉ tồn tại trong bộ nhớ trong 2 phút.

Thanh toán SePay và gửi email cần thông tin dịch vụ thật; kiểm tra kết nối cục bộ không xác nhận các tích hợp bên ngoài này.
