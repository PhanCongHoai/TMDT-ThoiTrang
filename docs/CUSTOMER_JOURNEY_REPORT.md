# BÁO CÁO HOÀN THIỆN CUSTOMER JOURNEY DASHBOARD (CUSTOMER JOURNEY REPORT)

**Ngày cập nhật:** 2026-11-12  
**Phạm vi:** `backend/src/modules/analytics/analytics.service.js`, `analytics.routes.js`, `frontend/admin.html`

---

## 1. Nâng Cấp API (`GET /api/admin/analytics/customer/:id`)

- **Bảo mật & Phân quyền:** Route nằm sau `verifyToken, requireAdmin`. Kiểm tra `id > 0` (`400 Bad Request`), trả `404` nếu không tồn tại khách hàng. Chỉ trả về trường công khai (`id, full_name, email, phone, created_at`), tuyệt đối không lộ `password_hash` hoặc token.
- **Bộ lọc & Phân trang:** Hỗ trợ `eventName`, `sessionId`, `productId`, `from`, `to`, `page`, `limit` (tối đa `100`).
- **Dữ liệu trả về:**
  - `customer`: Thông tin cơ bản của hội viên.
  - `summary`: `total_events`, `total_sessions`, `pages_viewed`, `products_viewed`, `cart_adds`, `searches`, `purchases`, `total_orders`, `total_spent`.
  - `sessions`: Tối đa 30 phiên gần nhất (`user_sessions`).
  - `events`: Timeline chi tiết (`user_events` JOIN `products`) sắp xếp giảm dần theo `event_timestamp` với `pagination` (`page`, `limit`, `total`, `totalPages`).
  - `recentOrders`: 15 đơn hàng gần nhất.
  - `recentSearches`: 15 từ khóa tìm kiếm gần nhất (`user_search_history`).

---

## 2. Tích Hợp Admin Dashboard (`frontend/admin.html`)

- Tại bảng **4. Quản Lý Khách Hàng VIP** (`#admin-customers-tbody`): đã bổ sung nút **Hành Trình** (`window.openCustomerJourney(userId)`) cho từng khách hàng.
- Đã thêm **Customer Journey Modal** (`#admin-customer-journey-modal`) với:
  - Header thông tin hội viên + 6 thẻ KPI hành vi & chi tiêu.
  - Thanh lọc theo loại sự kiện, phiên (`session_id`), khoảng ngày (`from` / `to`).
  - Bảng timeline chi tiết có phân trang (`Trước` / `Sau`).
  - Khung **Đơn Hàng Gần Nhất** và **Tìm Kiếm Gần Đây** đối chiếu trực tiếp.

---

## 3. Kiểm Thử Chức Năng

- Các test case API (khách hàng có lịch sử nhiều session, khách hàng rỗng chưa có sự kiện, khách hàng không tồn tại `404`, người dùng thường bị chặn `403`, chưa đăng nhập `401`) được kiểm chứng trong bộ E2E Phase 7 (`docs/FINAL_ACCEPTANCE_REPORT.md`).

