const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');
const { poolPromise } = require('./config/db');
const logger = require('./utils/logger');
const { startExpiredOrdersCron } = require('./jobs/expiredOrders.job');

// Kiểm tra kết nối CSDL và lắng nghe port
poolPromise
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`[AURALIÈ Enterprise Server] Đang chạy tại http://localhost:${PORT}`);
      logger.info(`[Environment] Mode: ${NODE_ENV}`);
      
      // Bắt đầu Background Worker giải phóng đơn hàng SePay hết hạn 15 phút
      startExpiredOrdersCron(60000);
    });
  })
  .catch((err) => {
    logger.error('[Fatal Error] Không thể kết nối cơ sở dữ liệu khi khởi động:', err);
    process.exit(1);
  });

// Xử lý các ngoại lệ chưa bắt được (Process Hardening)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Unhandled Rejection] Tại promise:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('[Uncaught Exception] Lỗi nghiêm trọng:', error);
  process.exit(1);
});
