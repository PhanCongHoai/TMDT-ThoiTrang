const express = require('express');
const router = express.Router();
const RecommendationService = require('./recommendations.service');
const ApiResponse = require('../../utils/response');
const { optionalAuth } = require('../../middlewares/auth.middleware');

// GET /api/v1/recommendations
// Hỗ trợ cả khách vãng lai (session_id, anonymous_id) và khách đăng nhập (JWT token)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId || null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId || null;
    const anonymousId = req.headers['x-anonymous-id'] || req.query.anonymousId || null;
    const productId = req.query.productId || null;
    const limit = Number(req.query.limit) || 6;

    const result = await RecommendationService.getRecommendations({
      userId,
      sessionId,
      anonymousId,
      limit,
      productId
    });

    return ApiResponse.success(
      res,
      result.items,
      result.mode === 'PERSONALIZED_HYBRID'
        ? 'Gợi ý sản phẩm cá nhân hóa theo phong cách của bạn'
        : 'Gợi ý sản phẩm thịnh hành được yêu thích nhất',
      200,
      {
        total: result.total,
        mode: result.mode,
        contextCount: result.contextProductCount
      }
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/recommendations/similar/:productId
router.get('/similar/:productId', optionalAuth, async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const limit = Number(req.query.limit) || 4;

    const result = await RecommendationService.getRecommendations({
      productId,
      limit
    });

    return ApiResponse.success(res, result.items, 'Lấy danh sách sản phẩm tương tự thành công', 200, {
      total: result.total
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
