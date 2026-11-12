# BACKEND API INVENTORY & REPOSITORY REFERENCE
**Dự án:** AURALIÈ Haute Couture — Luxury E-Commerce Platform  
**Trạng thái:** Chuẩn hóa phục vụ Phase 3.2 Modularization  

---

## 1. TỔNG QUAN DANH MỤC API (41 ENDPOINTS TOÀN HỆ THỐNG)

| STT | Phương thức | Đường dẫn Endpoint | Nhóm Module | Quyền hạn (Auth/RBAC) | Tệp phụ trách mục tiêu |
|:---:|:---:|---|---|---|---|
| 1 | `GET` | `/api/health` | System | Public | `src/app.js` |
| 2 | `POST` | `/api/v1/auth/register` | Auth | Public (Rate-limited) | `src/modules/auth/` |
| 3 | `POST` | `/api/v1/auth/login` | Auth | Public (Rate-limited) | `src/modules/auth/` |
| 4 | `GET` | `/api/v1/auth/me` | Auth | Bearer Token | `src/modules/auth/` |
| 5 | `PUT` | `/api/v1/auth/change-password` | Auth | Bearer Token | `src/modules/auth/` |
| 6 | `GET` | `/api/v1/categories` | Categories | Public | `src/modules/categories/` |
| 7 | `GET` | `/api/v1/products` | Products | Public | `src/modules/products/` |
| 8 | `GET` | `/api/v1/products/:id` | Products | Public | `src/modules/products/` |
| 9 | `POST` | `/api/v1/products` | Products | **Admin only** | `src/modules/products/` |
| 10 | `DELETE`| `/api/v1/products/:id` | Products | **Admin only** | `src/modules/products/` |
| 11 | `GET` | `/api/v1/products/:id/reviews` | Reviews | Public | `src/modules/reviews/` |
| 12 | `POST` | `/api/v1/reviews` | Reviews | Public | `src/modules/reviews/` |
| 13 | `GET` | `/api/v1/admin/reviews` | Reviews | **Admin only** | `src/modules/reviews/` |
| 14 | `PUT` | `/api/v1/reviews/:id/approve` | Reviews | **Admin only** | `src/modules/reviews/` |
| 15 | `DELETE`| `/api/v1/reviews/:id` | Reviews | **Admin only** | `src/modules/reviews/` |
| 16 | `POST` | `/api/v1/coupons/apply` | Coupons | Public (Rate-limited) | `src/modules/coupons/` |
| 17 | `GET` | `/api/v1/users/profile` | Users | Public / Token | `src/modules/users/` |
| 18 | `PUT` | `/api/v1/users/profile` | Users | Public / Token | `src/modules/users/` |
| 19 | `GET` | `/api/v1/users/shipping-info` | Users | Bearer Token | `src/modules/users/` |
| 20 | `GET` | `/api/v1/users` | Users | **Admin only** | `src/modules/users/` |
| 21 | `GET` | `/api/v1/sepay/config` | Orders / SePay | Public | `src/modules/orders/` |
| 22 | `POST` | `/api/v1/orders` | Orders | Optional Auth | `src/modules/orders/` |
| 23 | `GET` | `/api/v1/orders/:orderCode/payment-status` | Orders | Public | `src/modules/orders/` |
| 24 | `POST` | `/api/v1/sepay/webhook` | Orders / SePay | ApiKey Verify (Header) | `src/modules/orders/` |
| 25 | `POST` | `/api/v1/sepay/simulate-payment` | Orders / SePay | **Admin Only (Dev only, Blocked in Prod)** | `src/modules/orders/` |
| 26 | `GET` | `/api/v1/orders/track/:code` | Orders | Public | `src/modules/orders/` |
| 27 | `POST` | `/api/v1/orders/:id/cancel` | Orders | Optional Auth (Customer / Admin) | `src/modules/orders/` |
| 28 | `POST` | `/api/v1/orders/cleanup-expired` | Orders | **Admin only** | `src/modules/orders/` |
| 29 | `GET` | `/api/v1/orders` | Orders | **Admin only** | `src/modules/orders/` |
| 30 | `PUT` | `/api/v1/orders/:id/status` | Orders | **Admin only** | `src/modules/orders/` |
| 31 | `GET` | `/api/v1/blogs` | Blogs | Public | `src/modules/blogs/` |
| 32 | `GET` | `/api/v1/admin/inventory/batches` | Admin | **Admin only** | `src/modules/admin/` |
| 33 | `POST` | `/api/v1/admin/inventory/batch-import` | Admin | **Admin only** | `src/modules/admin/` |
| 34 | `GET` | `/api/v1/admin/stats` | Admin | **Admin only** | `src/modules/admin/` |
| 35 | `POST` | `/api/v1/ai/chat` | AI | Public | `src/modules/ai/` |
| 36 | `POST` | `/api/v1/ai/search-image` | AI | Public | `src/modules/ai/` |
| 37 | `GET` | `/api/v1/wishlist` | Wishlist | Bearer Token | `src/modules/wishlist/` |
| 38 | `POST` | `/api/v1/wishlist` | Wishlist | Bearer Token | `src/modules/wishlist/` |
| 39 | `DELETE`| `/api/v1/wishlist/:productId` | Wishlist | Bearer Token | `src/modules/wishlist/` |
| 40 | `POST` | `/api/v1/contact` | Inquiries | Public | `src/modules/inquiries/` |
| 41 | `POST` | `/api/v1/newsletter/subscribe` | Inquiries | Public | `src/modules/inquiries/` |

---

## 2. QUAN HỆ PHỤ THUỘC & CSDL SỬ DỤNG
- **Database Engine:** Microsoft SQL Server (`AURALIE_FashionDB`)
- **Connection Wrapper:** `src/config/db.js` (`poolPromise`, `query(sqlString, params)`)
- **Thư viện chính:**
  - `bcryptjs`: Băm mật khẩu (salt 12)
  - `jsonwebtoken`: Ký & giải mã JWT (`JWT_SECRET`, hạn 7 ngày)
  - `express-rate-limit`: Chống brute-force (`authLimiter`, `globalLimiter`)
  - `helmet`: Thiết lập HTTP security headers
  - `cors`: Lọc origin an toàn

