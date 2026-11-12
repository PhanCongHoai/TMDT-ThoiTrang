const ApiResponse = require('../utils/response');

/**
 * 404 Not Found Middleware
 * Xử lý khi client gọi đến một endpoint API không tồn tại
 */
function notFoundHandler(req, res, next) {
  return ApiResponse.error(res, `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`, 404);
}

module.exports = notFoundHandler;

