# KIẾN TRÚC HỆ THỐNG — AURALIÈ HAUTE COUTURE
**Enterprise Clean Architecture & Security Reference Manual**

---

## 1. TỔNG QUAN HỆ THỐNG
AURALIÈ Haute Couture là nền tảng thương mại điện tử thời trang may đo cao cấp (Haute Couture) được thiết kế theo nguyên tắc **Separation of Concerns (SoC)**, **Clean Architecture**, và **Feature-based Modular Design**.

Hệ thống bao gồm 3 phân tầng chính:
- **Client Tier (Frontend):** Multi-Page Application xây dựng bằng HTML5, CSS3, Vanilla ES6 JavaScript, đóng gói và phục vụ qua Vite.
- **Application Tier (Backend API):** RESTful Web Service xây dựng bằng Node.js & Express, phân chia các module nghiệp vụ độc lập (Auth, Products, Orders, Reviews, Coupons, Users, Wishlist, Inquiries, Admin).
- **Data Tier (Database):** Microsoft SQL Server (`AURALIE_FashionDB`) lưu trữ tập trung với 18 bảng nghiệp vụ.

---

## 2. KIẾN TRÚC PHÂN TẦNG BACKEND (LAYERED ARCHITECTURE)

```
[ HTTP Request: Frontend / Mobile / 3rd Party ]
                       │
                       ▼
             [ Entry: server.js ]
                       │
                       ▼
              [ Express: app.js ]
                       │
                       ├─► [ Helmet: HTTP Security Headers ]
                       ├─► [ CORS: Origin Whitelisting ]
                       ├─► [ Rate Limiting: Global & Auth Shield ]
                       └─► [ JSON & URL-Encoded Body Parsers ]
                                │
                                ▼
                   [ Route Layer (/api/v1/*) ]
                                │
                                ├─► [ Middleware: verifyToken (JWT Verification) ]
                                └─► [ Middleware: requireAdmin (Role-Based Access Control) ]
                                         │
                                         ▼
                             [ Controller Layer (*.controller.js) ]
                             - Nhận request, trích xuất parameters & body
                             - Điều phối kết quả qua ApiResponse standardizer
                                         │
                                         ▼
                              [ Service Layer (*.service.js) ]
                              - Xử lý Business Logic thuần túy
                              - Mã hóa mật khẩu bcrypt
                              - Tích hợp cổng SePay VietQR
                                         │
                                         ▼
                            [ Repository Layer (*.repository.js) ]
                            - Thực thi Parameterized SQL Queries an toàn
                            - Tương tác với connection pool
                                         │
                                         ▼
                          [ Database: MS SQL Server Connection Pool ]
```

---

## 3. DANH MỤC CÁC MODULE NGHIỆP VỤ

| Module | Đường dẫn thư mục | Trách nhiệm chính |
|---|---|---|
| **Auth** | `src/modules/auth/` | Đăng ký, đăng nhập bcrypt (salt 12), sinh/xác thực JWT token, đổi mật khẩu. |
| **Products** | `src/modules/products/` | Lấy danh mục, chi tiết sản phẩm kèm variants, tìm kiếm, lọc tag, thêm/xóa sản phẩm (Admin). |
| **Categories**| `src/modules/categories/` | Lấy danh mục sản phẩm và thống kê số lượng tồn kho theo danh mục. |
| **Orders** | `src/modules/orders/` | Tạo đơn hàng (COD/VISA/SePay), sinh mã VietQR, Webhook SePay tự động, tra cứu vận đơn GHN. |
| **Reviews** | `src/modules/reviews/` | Lấy đánh giá sản phẩm, gửi đánh giá, phê duyệt và kiểm duyệt đánh giá (Admin). |
| **Coupons** | `src/modules/coupons/` | Kiểm tra tính hợp lệ và áp dụng mã giảm giá VIP theo hạn mức đơn hàng. |
| **Users** | `src/modules/users/` | Quản lý hồ sơ hội viên VIP, cập nhật sổ địa chỉ, lấy danh sách khách hàng (Admin). |
| **Wishlist** | `src/modules/wishlist/` | Lưu trữ sản phẩm yêu thích của từng tài khoản người dùng vào CSDL. |
| **Inquiries** | `src/modules/inquiries/` | Tiếp nhận lịch hẹn tư vấn may đo VIP và đăng ký bản tin thời trang. |
| **Admin** | `src/modules/admin/` | Thống kê KPI doanh thu, đơn hàng, nhập kho hàng loạt theo lô (Batch Imports). |
| **AI** | `src/modules/ai/` | Trợ lý phong cách AI Stylist Chatbot và Computer Vision trích xuất kiểu dáng trang phục. |

