# HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH (DEPLOYMENT & PRODUCTION GUIDE)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  

---

## 1. YÊU CẦU HỆ THỐNG (SYSTEM REQUIREMENTS)
- **Hệ điều hành:** Linux (Ubuntu 22.04 LTS khuyến nghị) hoặc Windows Server 2022.
- **Node.js:** Phiên bản 18 LTS hoặc 20 LTS (Node.js 22 tương thích hoàn toàn).
- **Cơ sở dữ liệu:** Microsoft SQL Server 2019 / 2022 (Developer, Standard hoặc Enterprise Edition).
- **Reverse Proxy:** Nginx (hoặc Cloudflare Tunnel / IIS) hỗ trợ SSL/TLS Termination.
- **Process Manager:** PM2 (khuyến nghị cho môi trường production).

---

## 2. BƯỚC 1: CẤU HÌNH CƠ SỞ DỮ LIỆU SQL SERVER
1. Khởi động dịch vụ SQL Server (đảm bảo TCP/IP Port 1433 đang lắng nghe).
2. Chạy kịch bản khởi tạo database:
   ```sql
   -- Trong SQL Server Management Studio (SSMS)
   -- Chạy file database/schema.sql và database/seed.sql
   ```
3. Tạo tài khoản người dùng ứng dụng riêng biệt có quyền vừa đủ trên database `AURALIE_FashionDB`:
   ```sql
   USE master;
   CREATE LOGIN auralie_user WITH PASSWORD = 'YourStrongProductionPassword2026@';
   USE AURALIE_FashionDB;
   CREATE USER auralie_user FOR LOGIN auralie_user;
   ALTER ROLE db_datareader ADD MEMBER auralie_user;
   ALTER ROLE db_datawriter ADD MEMBER auralie_user;
   ALTER ROLE db_ddladmin ADD MEMBER auralie_user;
   ```

---

## 3. BƯỚC 2: CẤU HÌNH BIẾN MÔI TRƯỜNG BACKEND
Tạo file `backend/.env` từ file mẫu `backend/.env.example`:
```env
PORT=5000
NODE_ENV=production

# Database Configuration (Microsoft SQL Server)
DB_TYPE=mssql
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_NAME=AURALIE_FashionDB
DB_USER=auralie_user
DB_PASSWORD=YourStrongProductionPassword2026@

# JWT Secret (Tối thiểu 32 ký tự ngẫu nhiên bảo mật cao)
JWT_SECRET=production_super_secret_jwt_key_auralie_fashion_2026_xyz
JWT_EXPIRES_IN=7d

# SePay Payment Gateway Configuration (https://sepay.vn)
SEPAY_BANK_CODE=MBBank
SEPAY_BANK_SHORTNAME=MB
SEPAY_ACCOUNT_NUMBER=0388888888
SEPAY_ACCOUNT_NAME=AURALIE HAUTE COUTURE
SEPAY_API_KEY=sepay_live_secret_api_key_here
```

---

## 4. BƯỚC 3: ĐÓNG GÓI & KHỞI CHẠY ỨNG DỤNG

### 4.1 Cài đặt dependencies và build Frontend
```bash
# Cài đặt backend
cd backend
npm install --production

# Build frontend tĩnh
cd ../frontend
npm install
npm run build
```
Thư mục `frontend/dist/` chứa toàn bộ mã nguồn tĩnh đã được tối ưu, nén gzip và minify sẵn sàng phục vụ qua Nginx.

### 4.2 Khởi chạy Backend bằng PM2
```bash
cd backend
npm install -g pm2
pm2 start src/server.js --name "auralie-api" -i max
pm2 save
pm2 startup
```

---

## 5. BƯỚC 4: CẤU HÌNH NGINX REVERSE PROXY
```nginx
server {
    listen 80;
    server_name auralie.vn www.auralie.vn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auralie.vn www.auralie.vn;

    ssl_certificate /etc/letsencrypt/live/auralie.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auralie.vn/privkey.pem;

    # Phục vụ Frontend tĩnh
    root /var/www/auralie/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy các API request về Node.js Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. BƯỚC 5: HEALTH CHECK & GIÁM SÁT
Kiểm tra tình trạng API hoạt động trực tiếp qua:
```bash
curl -i https://auralie.vn/api/health
```
Phản hồi thành công kỳ vọng:
```json
{
  "status": "success",
  "message": "AURALIÈ Haute Couture Enterprise API is running with Live Database",
  "database": "Microsoft SQL Server (AURALIE_FashionDB)",
  "totalProductsInDB": 20,
  "timestamp": "2026-11-05T12:00:00.000Z"
}
```
Worker dọn dẹp đơn hết hạn `ExpiredOrdersJob` sẽ tự động kích hoạt sau 5 giây khởi động và quét định kỳ mỗi 60 giây.

