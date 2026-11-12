const logger = require('../utils/logger');
const AnalyticsService = require('../modules/analytics/analytics.service');

let lastPredictDate = null;
let lastEvalWeek = null;
let lastTrainMonth = null;

async function runLifecycleTick() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = vnTime.toISOString().slice(0, 10);
  const monthStr = dateStr.slice(0, 7);
  const dayOfWeek = vnTime.getUTCDay(); // 1 = Monday
  const dayOfMonth = vnTime.getUTCDate();

  // 1. Tổng hợp dữ liệu & phát hiện bất thường hằng ngày
  try {
    await AnalyticsService.runDailyAggregation(dateStr);
  } catch (err) {
    logger.warn(`[ML Lifecycle] Lỗi tổng hợp dữ liệu hằng ngày: ${err.message}`);
  }

  // 2. Dự đoán hằng ngày (không retrain mỗi ngày)
  if (lastPredictDate !== dateStr) {
    try {
      await AnalyticsService.triggerPythonPredict();
      lastPredictDate = dateStr;
      logger.info(`[ML Lifecycle] Đã cập nhật dự báo hằng ngày (${dateStr})`);
    } catch (err) {
      logger.warn(`[ML Lifecycle] Bỏ qua dự báo hằng ngày (AI Service offline): ${err.message}`);
    }
  }

  // 3. Đánh giá mô hình hằng tuần (Thứ 2) & kiểm tra Early Drift Trigger
  const weekKey = `${monthStr}-W${Math.ceil(dayOfMonth / 7)}`;
  if (dayOfWeek === 1 && lastEvalWeek !== weekKey) {
    try {
      const evalRes = await AnalyticsService.triggerPythonEvaluate();
      lastEvalWeek = weekKey;
      logger.info(`[ML Lifecycle] Đã chạy đánh giá tuần: ${JSON.stringify(evalRes?.data || {})}`);
      if (evalRes?.data?.drift_detected) {
        logger.warn('[ML Lifecycle] Phát hiện Model Drift -> Kích hoạt kiểm tra Early Retraining');
        await AnalyticsService.triggerPythonTrain('EARLY_DRIFT_TRIGGER');
      }
    } catch (err) {
      logger.warn(`[ML Lifecycle] Bỏ qua đánh giá tuần: ${err.message}`);
    }
  }

  // 4. Huấn luyện lại định kỳ hằng tháng (Ngày 1 hàng tháng)
  if (dayOfMonth === 1 && lastTrainMonth !== monthStr) {
    try {
      await AnalyticsService.triggerPythonTrain('MONTHLY_SCHEDULED');
      lastTrainMonth = monthStr;
      logger.info(`[ML Lifecycle] Đã chạy huấn luyện định kỳ tháng ${monthStr}`);
    } catch (err) {
      logger.warn(`[ML Lifecycle] Bỏ qua huấn luyện tháng: ${err.message}`);
    }
  }
}

function startMLLifecycleCron(intervalMs = 6 * 60 * 60 * 1000) {
  logger.info(`[ML Lifecycle] Đã kích hoạt Scheduler (chu kỳ ${(intervalMs / 3600000).toFixed(1)}h)`);
  // Chạy nhẹ sau khi server khởi động 10s
  setTimeout(() => {
    runLifecycleTick().catch(() => {});
  }, 10000);
  setInterval(() => {
    runLifecycleTick().catch(() => {});
  }, intervalMs);
}

module.exports = { startMLLifecycleCron, runLifecycleTick };

