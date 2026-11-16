# BÁO CÁO HOÀN THIỆN EVENT TRACKING (TRACKING COMPLETION REPORT)

**Ngày cập nhật:** 2026-11-12  
**Phạm vi:** Frontend UI Event Hooks (`frontend/js/app.js`, `frontend/js/services/tracking/*`) & Server-side Purchase Reconciliation (`backend/src/modules/orders/orders.service.js`)

---

## 1. Các Sự Kiện Đã Hoàn Thiện Trên Giao Diện (`frontend/js/app.js`)

| Tên sự kiện (`event_name`) | Vị trí gắn hook | Thuộc tính chính ghi nhận | Chống trùng lặp |
|---|---|---|---|
| `banner_view` | `initBannerTracking()` (`IntersectionObserver`, threshold `0.4`) | `banner_id`, `banner_title` | `dedupeKey: banner-view-{id}` + `Set` |
| `banner_click` | `initBannerTracking()` trên `.d-hero-banner`, `.promo-widget`, `[data-banner-id]` | `banner_id`, `cta_text`, `cta_href` | `dedupeKey: banner-click-{id}` |
| `product_image_view` | `modalThumbs` click listener | `productId`, `image_index`, `image_src` | `dedupeKey: img-view-{pid}-{idx}` |
| `product_variant_select` | `modalColorDots` & `modalSizeBtns` click listeners | `productId`, `variant_type` (`color`/`size`), `color`, `size` | `dedupeKey: var-{type}-{pid}-{val}` |
| `cart_view` | `window.renderCartPage()` khi giỏ có sản phẩm | `item_count`, `total_qty`, `subtotal` | `window._trackedCartView` + `dedupeKey` |
| `update_cart_quantity` | `window.changeCartQty(index, delta)` | `productId`, `product_name`, `old_qty`, `new_qty`, `delta`, `size`, `color` | Không gửi nếu `new_qty === prev_qty` |
| `remove_from_cart` | `window.removeCartItem(index)` | `productId`, `product_name`, `qty`, `price`, `size`, `color` | Theo thao tác xóa thực tế |
| `coupon_apply` | `applyCouponBtn` click -> `/api/v1/coupons/apply` | `coupon_code`, `discount_amount`, `order_amount`, `success` | Theo mỗi lần áp mã |
| `payment_method_select` | `#payment-method-group .payment-method-card` click | `payment_method` (`SEPAY_QR`, `COD`, ...) | `dedupeKey: pm-select-{method}` |
| `checkout_start` | `#btn-proceed-checkout` click | `item_count`, `subtotal`, `discount`, `final_total`, `payment_method`, `coupon_code` | `dedupeKey: checkout-start` |
| `checkout_information_submit` | `#btn-proceed-checkout` click | `payment_method`, `has_coupon`, `final_total` | `dedupeKey: checkout-info-submit` |

---

## 2. Đối Soát Sự Kiện `purchase` Phía Server (`orders.service.js`)

Để đảm bảo doanh thu & chuyển đổi không bị mất khi user chặn script trình duyệt hoặc không bị ghi trùng khi webhook thanh toán gọi lại:
- Đã bổ sung `OrderService.recordPurchaseEvent(...)` trong `backend/src/modules/orders/orders.service.js`:
  - Dùng `eventId = purchase-order-${orderId}` (idempotent theo `UQ` của `user_events.event_id`).
  - Tự động `upsertSession` (`srv-order-${orderId}`) trước khi insert vào `user_events` để đảm bảo khóa ngoại `FK_Events_Sessions`.
  - Bọc trong `try/catch` (non-blocking) để không bao giờ làm gián đoạn luồng tạo đơn hàng hoặc webhook SePay.
- Gắn tại 3 điểm xác nhận đơn hàng/thanh toán thành công:
  1. `OrderService.createOrder` khi `orderStatus === ORDER_STATUS.CONFIRMED` (ví dụ `COD`).
  2. `OrderService.handleSepayWebhook` khi `!recordResult.duplicate && newPaymentStatus === PAYMENT_STATUS.PAID`.
  3. `OrderService.simulatePayment` khi đơn hàng chuyển sang `PAID` / `CONFIRMED`.

---

## 3. Kiểm Tra Build Frontend

- Đã chạy `npm run build` trong `frontend/`: `✓ 24 modules transformed`, `✓ built in 596ms` (không có lỗi cú pháp hoặc đóng gói).
- Kiểm thử E2E ghi nhận vào SQL Server sẽ được thực hiện và tổng hợp tại Phase 7 (`docs/FINAL_ACCEPTANCE_REPORT.md`).

