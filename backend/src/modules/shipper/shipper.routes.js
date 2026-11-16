const express = require('express');
const router = express.Router();
const ShipperController = require('./shipper.controller');

// Danh sách đơn hàng giao
router.get('/orders', ShipperController.getOrders);

// Thống kê tài xế & COD
router.get('/stats', ShipperController.getStats);

// Tài xế nhận đơn lấy hàng (-> SHIPPED)
router.post('/orders/:id/pickup', ShipperController.pickupOrder);

// Tài xế xác nhận giao hàng thành công (-> COMPLETED, nếu COD -> PAID)
router.post('/orders/:id/deliver', ShipperController.deliverOrder);

// Báo cáo sự cố giao hàng / hẹn lại / hủy
router.post('/orders/:id/fail', ShipperController.reportDeliveryFailure);

// Tạo đơn hàng giả lập để thử nghiệm
router.post('/simulate/create-order', ShipperController.createSimulatedOrder);

module.exports = router;
