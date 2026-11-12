const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/env');

/**
 * Global Error Handling Middleware
 * Ngăn chặn rò rỉ stack trace & chi tiết câu lệnh SQL ra ngoài production
 */
function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]`, err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';

  // Che giấu chi tiết database nếu là production hoặc lỗi DB
  if (NODE_ENV === 'production' && statusCode === 500) {
    message = 'Hệ thống đang bận. Vui lòng liên hệ hỗ trợ kỹ thuật.';
  }

  return res.status(statusCode).json({
    status: 'error',
    message
  });
}

module.exports = errorHandler;
