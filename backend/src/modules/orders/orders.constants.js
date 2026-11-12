/**
 * ORDER & PAYMENT CONSTANTS
 * Hệ thống Quản trị Đơn hàng & Thanh toán AURALIE Haute Couture
 */

const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',       // Chờ thanh toán / Chờ xác nhận
  CONFIRMED: 'CONFIRMED',   // Đã xác nhận / Đã thanh toán
  PROCESSING: 'PROCESSING', // Đang đóng gói / May đo thủ công
  SHIPPED: 'SHIPPED',       // Đang giao hàng
  COMPLETED: 'COMPLETED',   // Giao hàng thành công
  CANCELLED: 'CANCELLED'    // Đã hủy đơn
});

const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',                 // Chưa thanh toán
  PARTIALLY_PAID: 'PARTIALLY_PAID', // Thanh toán một phần (chuyển thiếu)
  PAID: 'PAID',                     // Đã thanh toán đủ/thừa
  REFUNDED: 'REFUNDED'              // Đã hoàn tiền
});

const PAYMENT_METHOD = Object.freeze({
  COD: 'COD',               // Thanh toán khi nhận hàng
  VISA: 'VISA',             // Thẻ quốc tế Visa/Mastercard
  SEPAY_QR: 'SEPAY_QR'      // Chuyển khoản VietQR tự động qua SePay
});

const ORDER_HOLD_MINUTES = 15; // Thời gian giữ tồn kho khi chờ chuyển khoản QR

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ORDER_HOLD_MINUTES
};

