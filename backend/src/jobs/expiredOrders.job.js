const OrderRepository = require('../modules/orders/orders.repository');
const logger = require('../utils/logger');

let timer = null;
let isRunning = false;

/**
 * Worker tự động quét và giải phóng tồn kho các đơn hàng hết hạn thanh toán (TTL 15 phút)
 */
async function runCleanupTask() {
  if (isRunning) return; // Tránh overlapping nếu một vòng quét chạy quá 60s
  isRunning = true;
  try {
    const releasedOrders = await OrderRepository.releaseExpiredOrders(15);
    if (releasedOrders && releasedOrders.length > 0) {
      logger.info(`[ExpiredOrdersJob] Đã tự động hủy và hoàn kho cho ${releasedOrders.length} đơn hàng hết hạn 15 phút:`, {
        orders: releasedOrders.map(o => o.orderCode)
      });
    }
  } catch (err) {
    logger.error('[ExpiredOrdersJob Error] Lỗi trong quá trình quét đơn hết hạn:', err);
  } finally {
    isRunning = false;
  }
}

function startExpiredOrdersCron(intervalMs = 60000) {
  if (timer) return;
  logger.info(`[ExpiredOrdersJob] Khởi động Background Worker kiểm tra đơn hết hạn (chu kỳ ${intervalMs / 1000}s)`);
  // Chạy lần đầu sau 5 giây khởi động server
  setTimeout(runCleanupTask, 5000);
  timer = setInterval(runCleanupTask, intervalMs);
}

function stopExpiredOrdersCron() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('[ExpiredOrdersJob] Đã dừng Background Worker');
  }
}

module.exports = {
  startExpiredOrdersCron,
  stopExpiredOrdersCron,
  runCleanupTask
};

