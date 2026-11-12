const ApiResponse = require('../../utils/response');
const TrackingService = require('./tracking.service');

class TrackingController {
  static async saveConsent(req, res, next) {
    try {
      const data = await TrackingService.recordConsent(req.user || null, req.body);
      return ApiResponse.success(res, data, 'Đã ghi nhận lựa chọn quyền riêng tư');
    } catch (err) {
      next(err);
    }
  }

  static async startSession(req, res, next) {
    try {
      const data = await TrackingService.startSession(req.user || null, req.body);
      return ApiResponse.success(res, data, 'Khởi tạo phiên truy cập thành công');
    } catch (err) {
      next(err);
    }
  }

  static async heartbeat(req, res, next) {
    try {
      const data = await TrackingService.heartbeat(req.user || null, req.body);
      return ApiResponse.success(res, data, 'Cập nhật phiên truy cập thành công');
    } catch (err) {
      next(err);
    }
  }

  static async trackSingleEvent(req, res, next) {
    try {
      const data = await TrackingService.ingestEvents(req.user || null, req.body);
      return ApiResponse.success(res, data, 'Đã ghi nhận sự kiện', 201);
    } catch (err) {
      next(err);
    }
  }

  static async trackBatchEvents(req, res, next) {
    try {
      const events = req.body?.events || req.body;
      const data = await TrackingService.ingestEvents(req.user || null, events);
      return ApiResponse.success(res, data, 'Đã ghi nhận batch sự kiện', 201);
    } catch (err) {
      next(err);
    }
  }

  static async syncCart(req, res, next) {
    try {
      const data = await TrackingService.syncCart(req.user || null, req.body);
      return ApiResponse.success(res, data, 'Đã đồng bộ giỏ hàng');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TrackingController;

