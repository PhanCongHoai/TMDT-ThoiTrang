const OrderService = require('./orders.service');
const ApiResponse = require('../../utils/response');

/**
 * OrderController - Điều hướng HTTP Request cho Đơn Hàng & SePay
 */
class OrderController {
  static async createOrder(req, res, next) {
    try {
      const { fullName, phone, address, cartItems, items, paymentMethod, couponCode } = req.body;
      const user = req.user || null;

      const orderData = await OrderService.createOrder({
        fullName,
        phone,
        address,
        cartItems,
        items,
        paymentMethod,
        couponCode,
        user
      });

      return ApiResponse.success(res, orderData, 'Tạo đơn hàng thành công và đã lưu vào CSDL!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getPaymentStatus(req, res, next) {
    try {
      const { orderCode } = req.params;
      const statusData = await OrderService.getPaymentStatus(orderCode);
      return ApiResponse.success(res, statusData, 'Lấy trạng thái thanh toán thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getSepayConfig(req, res, next) {
    try {
      const cfg = OrderService.getSepayConfig();
      return ApiResponse.success(res, {
        bankCode: cfg.bankCode,
        bankShortName: cfg.bankShortName,
        accountNumber: cfg.accountNumber,
        accountName: cfg.accountName
      });
    } catch (err) {
      next(err);
    }
  }

  static async sepayWebhook(req, res, next) {
    try {
      const result = await OrderService.handleSepayWebhook(req.headers, req.body);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async simulateSepayPayment(req, res, next) {
    try {
      const { orderCode } = req.body;
      if (!orderCode) {
        return ApiResponse.error(res, 'Mã đơn hàng là bắt buộc', 400);
      }
      const result = await OrderService.simulatePayment(orderCode);
      return ApiResponse.success(res, result, `[Giả Lập SePay] Đã cập nhật đơn hàng ${orderCode} sang ĐÃ THANH TOÁN trực tiếp vào SQL Server!`);
    } catch (err) {
      next(err);
    }
  }

  static async getMyOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;
      const result = await OrderService.getMyOrders(userId, { page, limit });
      return ApiResponse.success(res, result.items, 'Lấy danh sách đơn hàng cá nhân thành công', 200, {
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderDetails(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user || null;
      const { phone } = req.query;
      const order = await OrderService.getOrderDetails(id, user, phone);
      return ApiResponse.success(res, order, 'Lấy chi tiết đơn hàng thành công');
    } catch (err) {
      next(err);
    }
  }

  static async trackOrder(req, res, next) {
    try {
      const code = req.params.orderCode || req.params.code;
      const { phone } = req.query;
      const order = await OrderService.trackOrder(code, phone, req.user || null);
      return ApiResponse.success(res, order, 'Tra cứu đơn hàng thành công');
    } catch (err) {
      next(err);
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user || null;
      const { reason } = req.body || {};
      const result = await OrderService.cancelOrderWithOwnership(id, user, reason);
      return ApiResponse.success(res, result, `Đã hủy đơn hàng #${id} và hoàn tồn kho thành công!`);
    } catch (err) {
      next(err);
    }
  }

  static async releaseExpiredOrders(req, res, next) {
    try {
      const results = await OrderService.releaseExpiredReservations();
      return ApiResponse.success(res, results, `Đã quét và hoàn kho các đơn hàng hết hạn.`);
    } catch (err) {
      next(err);
    }
  }

  static async getAllOrders(req, res, next) {
    try {
      const { page, limit, search, status, paymentStatus, startDate, endDate } = req.query;
      const result = await OrderService.getAdminOrders({
        page,
        limit,
        search,
        status,
        paymentStatus,
        startDate,
        endDate
      });
      return ApiResponse.success(res, result.items, 'Lấy danh sách đơn hàng thành công', 200, {
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPaymentTransactions(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await OrderService.getPaymentTransactions({ page, limit });
      return ApiResponse.success(res, result.items, 'Lấy danh sách giao dịch thanh toán thành công', 200, {
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await OrderService.updateOrderStatus(id, status);
      return ApiResponse.success(res, null, `Đã cập nhật trạng thái đơn #${id} sang ${status} thành công!`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
