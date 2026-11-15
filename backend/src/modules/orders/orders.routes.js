const express = require('express');
const router = express.Router();
const OrderController = require('./orders.controller');
const OrderValidation = require('./orders.validation');
const { verifyToken, requireAdmin, optionalAuth } = require('../../middlewares/auth.middleware');

const ApiResponse = require('../../utils/response');

// Khách hàng xem danh sách đơn hàng của chính mình (My Orders)
router.get(
  '/orders/my-orders',
  verifyToken,
  OrderController.getMyOrders
);

// Admin xem lịch sử giao dịch thanh toán
router.get(
  '/orders/transactions',
  verifyToken,
  requireAdmin,
  OrderController.getPaymentTransactions
);

// Chi tiết đơn hàng (hỗ trợ kiểm tra quyền sở hữu IDOR)
router.get(
  '/orders/:id',
  optionalAuth,
  OrderController.getOrderDetails
);

// Creating an order always requires an authenticated customer.
router.post(
  '/orders',
  verifyToken,
  OrderValidation.validateCreateOrder,
  OrderController.createOrder
);

router.get(
  '/orders/:orderCode/payment-status',
  OrderValidation.validateOrderCode,
  OrderController.getPaymentStatus
);

router.get(
  '/orders/track/:code',
  optionalAuth,
  OrderValidation.validateOrderCode,
  OrderController.trackOrder
);

// Hủy đơn hàng và hoàn kho (Khách hàng hoặc Quản trị viên)
router.post(
  '/orders/:id/cancel',
  verifyToken,
  OrderController.cancelOrder
);

// SePay endpoints
router.get('/sepay/config', OrderController.getSepayConfig);
router.post('/sepay/webhook', OrderController.sepayWebhook);

// SePay Simulate endpoint (Development & Admin only, blocked in production)
router.post(
  '/sepay/simulate-payment',
  (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      return ApiResponse.error(res, 'API Giả lập thanh toán bị vô hiệu hóa hoàn toàn trên môi trường Production.', 403);
    }
    next();
  },
  verifyToken,
  requireAdmin,
  OrderController.simulateSepayPayment
);

// Admin-only endpoints
router.get('/orders', verifyToken, requireAdmin, OrderController.getAllOrders);
router.put('/orders/:id/status', verifyToken, requireAdmin, OrderController.updateStatus);
router.post('/orders/cleanup-expired', verifyToken, requireAdmin, OrderController.releaseExpiredOrders);

module.exports = router;
