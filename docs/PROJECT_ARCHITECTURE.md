# TÀI LIỆU KIẾN TRÚC HỆ THỐNG (PROJECT ARCHITECTURE)
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Phiên bản:** 2.0 Enterprise Release  
**Kiến trúc:** Clean Modular Architecture (Backend) & Component-driven MPA (Frontend)

---

## 1. TỔNG QUAN KIẾN TRÚC TOÀN HỆ THỐNG

```
[ FRONTEND LAYER ]
│   - Multi-Page Application (MPA) chuẩn SEO & Luxury Experience
│   - HTML5, Vanilla JavaScript ES6+, Custom Luxury CSS
│   - Unified HTTP Client (js/api/client.js) với cơ chế JWT Auth Guard & Session Storage
│   - Vite Build System (Minification, Hashing, Gzip optimization)
│
▼ (HTTP / HTTPS / REST API / JSON Contract)
│
[ BACKEND API GATEWAY & SECURITY LAYER ]
│   - Node.js 18+ / Express 4
│   - Helmet Security Headers (CSP, Frameguard, XSS filter)
│   - CORS Origin Whitelist (localhost, 127.0.0.1, custom production domains)
│   - Express Rate Limiting (Brute-force protection for Auth & Global API)
│   - Centralized Global Error Handler & 404 Catch-All
│   - Process Hardening (unhandledRejection & uncaughtException)
│
▼
│
[ BUSINESS MODULES LAYER (Clean Modular) ]
│   ├── auth/          -> Authentication, JWT Token, Password Hashing
│   ├── products/      -> Catalog, Variants, Stock, Categories, Full-text Search
│   ├── orders/        -> Order Lifecycle, State Machine, Inventory Reservation
│   ├── reviews/       -> Customer Ratings & Admin Moderation
│   ├── coupons/       -> Discounts, Expiry & Usage Validation
│   ├── users/         -> Profiles, Address Book, IDOR Protection
│   ├── wishlist/      -> Customer Saved Items
│   ├── inquiries/     -> VIP Concierge Appointments & Newsletter
│   ├── admin/         -> Dashboard KPI Metrics & Inventory Batches
│   └── ai/            -> Stylist Recommendation & Computer Vision
│
▼
│
[ ASYNCHRONOUS BACKGROUND WORKERS ]
│   └── jobs/expiredOrders.job.js -> Quét & hoàn kho đơn hàng SePay quá 15 phút (Mỗi 60s)
│
▼
│
[ PERSISTENCE & DATA INTEGRITY LAYER ]
│   - Microsoft SQL Server 2022 (AURALIE_FashionDB)
│   - Connection Pool (tedious / mssql driver)
│   - Atomic Transactions với khóa UPDLOCK & ROWLOCK
│   - UNIQUE Constraints bảo đảm Webhook Idempotency
```

---

## 2. PHÂN TẦNG TRÁCH NHIỆM (SEPARATION OF CONCERNS)

| Lớp | Thư mục / File | Trách nhiệm chính |
|---|---|---|
| **Routes** | `*.routes.js` | Định tuyến endpoint, gắn middleware bảo vệ (`verifyToken`, `requireAdmin`, `optionalAuth`), rate-limiter, validator |
| **Validation** | `*.validation.js` | Kiểm tra tính hợp lệ dữ liệu HTTP Request, định dạng, độ dài, kiểu dữ liệu |
| **Controller** | `*.controller.js` | Tiếp nhận Request, trích xuất DTO, gọi Service, trả về response chuẩn hóa qua `ApiResponse` |
| **Service** | `*.service.js` | Thực thi toàn bộ Business Logic, quy tắc tính giá từ DB, quy tắc thanh toán, kiểm tra trạng thái |
| **Repository** | `*.repository.js` | Thực thi các câu lệnh SQL Server đã được parameterized, quản lý `sql.Transaction`, khóa bảng |
| **Constants/State**| `*.constants.js`, `*.state-machine.js`| Lưu trữ Enum trạng thái, bảng ma trận chuyển đổi trạng thái hợp lệ |

---

## 3. NGUYÊN TẮC TOÀN VẸN DỮ LIỆU & BẢO MẬT
1. **Không tin tưởng dữ liệu Frontend:** Giá sản phẩm, giảm giá, tồn kho được tính toán 100% độc lập từ cơ sở dữ liệu.
2. **Khóa chống tương tranh (UPDLOCK, ROWLOCK):** Ngăn chặn Race Condition khi nhiều người cùng đặt 1 sản phẩm cuối cùng.
3. **Idempotency 2 Lớp:** Kết hợp tra cứu trước và ràng buộc duy nhất trên Database (`UQ__payment___DD5740BEE83CA53E`).
4. **Phân quyền chặt chẽ (RBAC):** Khách hàng chỉ truy cập được dữ liệu thuộc quyền sở hữu của mình, ngăn chặn triệt để IDOR.

