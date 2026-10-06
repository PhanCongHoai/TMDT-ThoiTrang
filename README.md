# AURALIÈ Haute Couture - Đồ Án Tốt Nghiệp (DATN)

Dự án website thương mại điện tử thời trang cao cấp **AURALIÈ Haute Couture** được cấu trúc theo mô hình decoupled (Client - Server) phân tách rõ ràng **Frontend**, **Backend API**, và **Database**.

---

## 📁 Cấu Trúc Dự Án (Project Layout)

```text
DATN/
├── frontend/                   # Giao diện người dùng (HTML5, CSS3, JavaScript)
│   ├── assets/                 # Banner, logo, hình ảnh thời trang
│   ├── css/                    # Stylesheet chính (styles.css)
│   ├── js/                     # Logic giao diện & tương tác
│   └── index.html              # Trang chủ giao diện Responsive (Desktop/Mobile)
│
├── backend/                    # Mã nguồn RESTful API Server (Node.js/Express)
│   ├── src/
│   │   ├── config/             # Cấu hình DB, JWT, Cloudinary
│   │   ├── controllers/        # Xử lý HTTP Request & Response
│   │   ├── services/           # Xử lý Business Logic
│   │   ├── models/             # Định nghĩa dữ liệu & ORM Schema
│   │   ├── routes/             # Định tuyến các đường dẫn API
│   │   ├── middlewares/        # JWT Auth, Phân quyền Admin, Validation
│   │   ├── utils/              # Helper functions
│   │   └── server.js           # File chạy chính của Backend Server
│   ├── package.json
│   └── .env.example
│
├── database/                   # Tài liệu & Kịch bản Cơ sở dữ liệu
│   ├── schema.sql              # Script khởi tạo các bảng CSDL (PostgreSQL / MySQL)
│   └── seed.sql                # Script nạp dữ liệu mẫu (Sản phẩm, Biến thể, Danh mục)
│
└── README.md
```

---

## 🛠️ Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 1. Khởi chạy Giao diện Frontend
- Mở file [`frontend/index.html`](file:///c:/Users/ASUS/Documents/Demo/DATN/frontend/index.html) trực tiếp bằng Trình duyệt web hoặc chạy qua VS Code Live Server.

### 2. Khởi chạy Backend Server (Node.js)
```bash
cd backend
npm install
npm run dev
```
- API Health Check: `http://localhost:5000/api/health`
- Sample API Products: `http://localhost:5000/api/v1/products`

### 3. Khởi tạo Cơ sở dữ liệu Database
- Sử dụng các file script trong thư mục `database/`:
  - Execute [`database/schema.sql`](file:///c:/Users/ASUS/Documents/Demo/DATN/database/schema.sql) để tạo bảng.
  - Execute [`database/seed.sql`](file:///c:/Users/ASUS/Documents/Demo/DATN/database/seed.sql) để tạo dữ liệu thời trang mẫu.
