const ShipperService = require('./shipper.service');
const ApiResponse = require('../../utils/response');

class ShipperController {
  /**
   * GET /api/v1/shipper/orders
   */
  static async getOrders(req, res, next) {
    try {
      const { tab = 'all', search = '' } = req.query;
      const orders = await ShipperService.getShipperOrders({ tab, search });
      return ApiResponse.success(res, orders, 'Tải danh sách đơn hàng cho Shipper thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/shipper/stats
   */
  static async getStats(req, res, next) {
    try {
      const stats = await ShipperService.getShipperStats();
      return ApiResponse.success(res, stats, 'Tải thống kê hoạt động giao hàng thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/shipper/orders/:id/pickup
   */
  static async pickupOrder(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ShipperService.pickupOrder(Number(id));
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/shipper/orders/:id/deliver
   */
  static async deliverOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { proofPhoto, signature, note } = req.body || {};
      const result = await ShipperService.deliverOrder(Number(id), { proofPhoto, signature, note });
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/shipper/orders/:id/fail
   */
  static async reportDeliveryFailure(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, action } = req.body || {};
      const result = await ShipperService.reportDeliveryFailure(Number(id), { reason, action });
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/shipper/simulate/create-order
   */
  static async createSimulatedOrder(req, res, next) {
    try {
      const order = await ShipperService.createSimulatedOrder();
      return ApiResponse.success(res, order, 'Đã tạo đơn hàng mới để mô phỏng giao hàng', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ShipperController;

