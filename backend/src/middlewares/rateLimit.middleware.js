const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/response');

// Giới hạn chung toàn hệ thống: 300 requests / 15 phút
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(res, 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.', 429);
  }
});

// Giới hạn đăng nhập/đăng ký: 20 lần / 15 phút (chống Brute-force & Credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(res, 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.', 429);
  }
});

module.exports = { globalLimiter, authLimiter };

