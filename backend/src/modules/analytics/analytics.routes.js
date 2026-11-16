const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/response');
const AnalyticsService = require('./analytics.service');

// Bảo vệ toàn bộ endpoint phân tích & AI bằng verifyToken + requireAdmin
router.use(verifyToken, requireAdmin);

// ====================================================================
// CUSTOMER BEHAVIOR ANALYTICS (/api/admin/analytics/*)
// ====================================================================
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await AnalyticsService.getBehaviorOverview(days);
    return ApiResponse.success(res, data, 'Lấy tổng quan hành vi khách hàng thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/conversion-funnel', async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await AnalyticsService.getConversionFunnel(days);
    return ApiResponse.success(res, data, 'Lấy phễu chuyển đổi thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/search', async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await AnalyticsService.getSearchAnalytics(days);
    return ApiResponse.success(res, data, 'Lấy thống kê tìm kiếm thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/top-products', async (req, res, next) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await AnalyticsService.getTopBehaviorProducts(days);
    return ApiResponse.success(res, data, 'Lấy top sản phẩm tương tác thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/product/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return ApiResponse.error(res, 'ID sản phẩm không hợp lệ', 400);
    const data = await AnalyticsService.getProductForecastDetail(id);
    return ApiResponse.success(res, data, 'Lấy phân tích chi tiết sản phẩm thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/customer/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) return ApiResponse.error(res, 'ID khách hàng không hợp lệ', 400);
    const data = await AnalyticsService.getCustomerJourney(id, {
      eventName: req.query.eventName,
      sessionId: req.query.sessionId,
      productId: req.query.productId,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      limit: req.query.limit
    });
    if (!data.customer) return ApiResponse.error(res, 'Không tìm thấy khách hàng', 404);
    return ApiResponse.success(res, data, 'Lấy hành trình khách hàng thành công');
  } catch (err) {
    next(err);
  }
});

// ====================================================================
// AI PRODUCT DEMAND FORECASTING & LIFECYCLE (/api/admin/ai/*)
// ====================================================================
router.get('/ai/forecast', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const data = await AnalyticsService.getCachedForecasts(days);
    return ApiResponse.success(res, data, 'Lấy dữ liệu dự báo nhu cầu thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/ai/top-predicted-products', async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const data = await AnalyticsService.getCachedForecasts(days);
    return ApiResponse.success(res, { ...data, items: data.items.slice(0, 20) }, 'Lấy top sản phẩm dự báo bán chạy thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/ai/product/:id/forecast', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return ApiResponse.error(res, 'ID sản phẩm không hợp lệ', 400);
    const data = await AnalyticsService.getProductForecastDetail(id);
    return ApiResponse.success(res, data, 'Lấy dự báo chi tiết sản phẩm thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/ai/low-stock-risk', async (req, res, next) => {
  try {
    const data = await AnalyticsService.getCachedForecasts(7);
    const risky = data.items.filter(item => item.low_stock_risk);
    return ApiResponse.success(res, risky, 'Lấy danh sách sản phẩm có nguy cơ thiếu hàng thành công');
  } catch (err) {
    next(err);
  }
});

router.get('/ai/model-performance', async (req, res, next) => {
  try {
    const data = await AnalyticsService.getModelPerformance();
    return ApiResponse.success(res, data, 'Lấy lịch sử đánh giá & phiên bản mô hình AI thành công');
  } catch (err) {
    next(err);
  }
});

router.post('/ai/model/rollback', async (req, res, next) => {
  try {
    const { modelVersion } = req.body || {};
    if (!modelVersion) return ApiResponse.error(res, 'modelVersion là bắt buộc', 400);
    const data = await AnalyticsService.rollbackModelVersion(modelVersion);
    return ApiResponse.success(res, data, `Đã rollback mô hình về phiên bản ${modelVersion}`);
  } catch (err) {
    next(err);
  }
});

router.post('/ai/run-aggregation', async (req, res, next) => {
  try {
    const data = await AnalyticsService.runDailyAggregation();
    return ApiResponse.success(res, data, 'Đã tổng hợp dữ liệu hằng ngày thành công');
  } catch (err) {
    next(err);
  }
});

router.post('/ai/trigger-predict', async (req, res, next) => {
  try {
    await AnalyticsService.runDailyAggregation();
    const data = await AnalyticsService.triggerPythonPredict();
    return ApiResponse.success(res, data, 'Đã chạy dự báo nhu cầu qua Python AI Service');
  } catch (err) {
    return ApiResponse.error(res, `Python AI Service hiện không khả dụng: ${err.message}`, 503);
  }
});

router.post('/ai/trigger-train', async (req, res, next) => {
  try {
    const data = await AnalyticsService.triggerPythonTrain('MANUAL');
    return ApiResponse.success(res, data, 'Đã thực thi quy trình đánh giá/huấn luyện mô hình');
  } catch (err) {
    return ApiResponse.error(res, `Python AI Service hiện không khả dụng: ${err.message}`, 503);
  }
});

router.post('/ai/trigger-evaluate', async (req, res, next) => {
  try {
    const data = await AnalyticsService.triggerPythonEvaluate();
    return ApiResponse.success(res, data, 'Đã chạy đánh giá sai số mô hình hằng tuần');
  } catch (err) {
    return ApiResponse.error(res, `Python AI Service hiện không khả dụng: ${err.message}`, 503);
  }
});

module.exports = router;

