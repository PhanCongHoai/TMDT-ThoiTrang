const { query } = require('../../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_INTERNAL_API_KEY = process.env.AI_INTERNAL_API_KEY || 'auralie_internal_ml_secret_2026';

async function callPythonAI(path, method = 'GET', body = null, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': AI_INTERNAL_API_KEY
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || `AI Service HTTP ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

class AnalyticsService {
  /**
   * Tổng hợp dữ liệu hành vi, đơn hàng hợp lệ và tồn kho mỗi ngày vào:
   * - ProductDailyMetrics
   * - ProductInventorySnapshots
   * - user_behavior_daily
   * Kèm phát hiện tăng/giảm bất thường (Anomaly Detection)
   */
  static async runDailyAggregation(targetDateStr = null) {
    const dateExpr = targetDateStr
      ? `'${targetDateStr}'`
      : `CAST(DATEADD(HOUR, 7, SYSUTCDATETIME()) AS DATE)`;

    // 1. Chụp tồn kho hiện tại vào ProductInventorySnapshots (idempotent MERGE)
    await query(`
      DECLARE @snapDate DATE = ${dateExpr};
      MERGE ProductInventorySnapshots AS target
      USING (
        SELECT p.id AS product_id, COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
      ) AS src
      ON (target.product_id = src.product_id AND target.snapshot_date = @snapDate)
      WHEN MATCHED THEN
        UPDATE SET stock_quantity = src.stock_quantity, is_out_of_stock = CASE WHEN src.stock_quantity <= 0 THEN 1 ELSE 0 END
      WHEN NOT MATCHED THEN
        INSERT (product_id, snapshot_date, stock_quantity, is_out_of_stock)
        VALUES (src.product_id, @snapDate, src.stock_quantity, CASE WHEN src.stock_quantity <= 0 THEN 1 ELSE 0 END);
    `);

    // 2. Tổng hợp ProductDailyMetrics cho ngày target (kết hợp Orders hợp lệ + Events + Wishlists + Stock)
    await query(`
      DECLARE @mDate DATE = ${dateExpr};
      WITH SalesCTE AS (
        SELECT 
          pv.product_id,
          COUNT(DISTINCT o.id) AS total_orders,
          SUM(oi.quantity) AS total_units_sold,
          SUM(oi.quantity * oi.price) AS total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
          AND (o.payment_method = 'COD' OR o.payment_status = 'PAID')
          AND CAST(DATEADD(HOUR, 7, o.created_at) AS DATE) = @mDate
        GROUP BY pv.product_id
      ),
      EventsCTE AS (
        SELECT 
          product_id,
          SUM(CASE WHEN event_name = 'product_view' THEN 1 ELSE 0 END) AS total_views,
          COUNT(DISTINCT CASE WHEN event_name = 'product_view' THEN anonymous_id END) AS unique_viewers,
          SUM(CASE WHEN event_name = 'search_result_click' THEN 1 ELSE 0 END) AS total_searches_clicked,
          SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS total_cart_adds,
          SUM(CASE WHEN event_name = 'wishlist_add' THEN 1 ELSE 0 END) AS total_wishlist_adds
        FROM user_events
        WHERE product_id IS NOT NULL
          AND CAST(DATEADD(HOUR, 7, event_timestamp) AS DATE) = @mDate
        GROUP BY product_id
      ),
      StockCTE AS (
        SELECT p.id AS product_id, p.base_price, COALESCE(SUM(pv.stock_quantity), 0) AS stock_qty
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.is_active = 1
        GROUP BY p.id, p.base_price
      )
      MERGE ProductDailyMetrics AS target
      USING (
        SELECT 
          st.product_id,
          @mDate AS metric_date,
          COALESCE(ev.total_views, 0) AS total_views,
          COALESCE(ev.unique_viewers, 0) AS unique_viewers,
          COALESCE(ev.total_searches_clicked, 0) AS total_searches_clicked,
          COALESCE(ev.total_cart_adds, 0) AS total_cart_adds,
          COALESCE(ev.total_wishlist_adds, 0) AS total_wishlist_adds,
          COALESCE(sa.total_orders, 0) AS total_orders,
          COALESCE(sa.total_units_sold, 0) AS total_units_sold,
          COALESCE(sa.total_revenue, 0) AS total_revenue,
          CASE WHEN COALESCE(ev.total_views, 0) > 0 
               THEN CAST(COALESCE(sa.total_orders, 0) AS DECIMAL(10,4)) / ev.total_views 
               ELSE 0 END AS conversion_rate,
          st.base_price AS current_price,
          st.stock_qty AS stock_quantity,
          CASE WHEN st.stock_qty <= 0 THEN 1 ELSE 0 END AS is_out_of_stock
        FROM StockCTE st
        LEFT JOIN EventsCTE ev ON st.product_id = ev.product_id
        LEFT JOIN SalesCTE sa ON st.product_id = sa.product_id
      ) AS src
      ON (target.product_id = src.product_id AND target.metric_date = src.metric_date)
      WHEN MATCHED THEN
        UPDATE SET
          total_views = src.total_views,
          unique_viewers = src.unique_viewers,
          total_searches_clicked = src.total_searches_clicked,
          total_cart_adds = src.total_cart_adds,
          total_wishlist_adds = src.total_wishlist_adds,
          total_orders = src.total_orders,
          total_units_sold = src.total_units_sold,
          total_revenue = src.total_revenue,
          conversion_rate = src.conversion_rate,
          current_price = src.current_price,
          stock_quantity = src.stock_quantity,
          is_out_of_stock = src.is_out_of_stock,
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (
          product_id, metric_date, total_views, unique_viewers, total_searches_clicked,
          total_cart_adds, total_wishlist_adds, total_orders, total_units_sold,
          total_revenue, conversion_rate, current_price, stock_quantity, is_out_of_stock
        )
        VALUES (
          src.product_id, src.metric_date, src.total_views, src.unique_viewers, src.total_searches_clicked,
          src.total_cart_adds, src.total_wishlist_adds, src.total_orders, src.total_units_sold,
          src.total_revenue, src.conversion_rate, src.current_price, src.stock_quantity, src.is_out_of_stock
        );
    `);

    // 3. Phát hiện bất thường tăng/giảm (SPIKE / DROP) so với trung bình 7 ngày trước
    await query(`
      DECLARE @mDate DATE = ${dateExpr};
      UPDATE pdm
      SET trend_anomaly_flag = CASE
        WHEN avg7.avg_views >= 5 AND pdm.total_views >= avg7.avg_views * 2.0 THEN 'SPIKE'
        WHEN avg7.avg_views >= 5 AND pdm.total_views <= avg7.avg_views * 0.3 THEN 'DROP'
        ELSE 'NORMAL'
      END
      FROM ProductDailyMetrics pdm
      CROSS APPLY (
        SELECT AVG(CAST(prev.total_views AS FLOAT)) AS avg_views
        FROM ProductDailyMetrics prev
        WHERE prev.product_id = pdm.product_id
          AND prev.metric_date >= DATEADD(DAY, -7, @mDate)
          AND prev.metric_date < @mDate
      ) avg7
      WHERE pdm.metric_date = @mDate;
    `);

    // 4. Tổng hợp user_behavior_daily
    await query(`
      DECLARE @bDate DATE = ${dateExpr};
      WITH ActorCTE AS (
        SELECT 
          CASE WHEN user_id IS NOT NULL THEN CONCAT('U:', user_id) ELSE CONCAT('A:', anonymous_id) END AS actor_key,
          MAX(user_id) AS user_id,
          MAX(anonymous_id) AS anonymous_id,
          SUM(CASE WHEN event_name = 'product_view' THEN 1 ELSE 0 END) AS total_product_views,
          SUM(CASE WHEN event_name = 'search' THEN 1 ELSE 0 END) AS total_searches,
          SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS total_cart_adds,
          SUM(CASE WHEN event_name = 'wishlist_add' THEN 1 ELSE 0 END) AS total_wishlist_adds,
          SUM(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) AS total_purchases
        FROM user_events
        WHERE CAST(DATEADD(HOUR, 7, event_timestamp) AS DATE) = @bDate
        GROUP BY CASE WHEN user_id IS NOT NULL THEN CONCAT('U:', user_id) ELSE CONCAT('A:', anonymous_id) END
      )
      MERGE user_behavior_daily AS target
      USING ActorCTE AS src
      ON (target.behavior_date = @bDate AND target.actor_key = src.actor_key)
      WHEN MATCHED THEN
        UPDATE SET
          total_product_views = src.total_product_views,
          total_searches = src.total_searches,
          total_cart_adds = src.total_cart_adds,
          total_wishlist_adds = src.total_wishlist_adds,
          total_purchases = src.total_purchases,
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (behavior_date, actor_key, user_id, anonymous_id, total_product_views, total_searches, total_cart_adds, total_wishlist_adds, total_purchases)
        VALUES (@bDate, src.actor_key, src.user_id, src.anonymous_id, src.total_product_views, src.total_searches, src.total_cart_adds, src.total_wishlist_adds, src.total_purchases);
    `);

    return { aggregated: true, date: targetDateStr || 'TODAY_VN' };
  }

  static async getBehaviorOverview(days = 30) {
    const res = await query(`
      SELECT
        SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS total_page_views,
        COUNT(DISTINCT anonymous_id) AS unique_visitors,
        SUM(CASE WHEN event_name = 'product_view' THEN 1 ELSE 0 END) AS total_product_views,
        SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS total_cart_adds,
        SUM(CASE WHEN event_name = 'checkout_start' THEN 1 ELSE 0 END) AS total_checkouts
      FROM user_events
      WHERE event_timestamp >= DATEADD(DAY, -@days, SYSUTCDATETIME())
    `, { days });

    const sessRes = await query(`
      SELECT
        COUNT(*) AS total_sessions,
        AVG(CAST(DATEDIFF(SECOND, started_at, last_activity_at) AS FLOAT)) AS avg_duration_sec,
        COUNT(DISTINCT CASE WHEN prev_sess.cnt = 0 THEN us.anonymous_id END) AS new_visitors,
        COUNT(DISTINCT CASE WHEN prev_sess.cnt > 0 THEN us.anonymous_id END) AS returning_visitors
      FROM user_sessions us
      CROSS APPLY (
        SELECT COUNT(*) AS cnt FROM user_sessions old_s
        WHERE old_s.anonymous_id = us.anonymous_id AND old_s.started_at < us.started_at
      ) prev_sess
      WHERE us.started_at >= DATEADD(DAY, -@days, SYSUTCDATETIME())
    `, { days });

    const ordRes = await query(`
      SELECT COUNT(*) AS valid_orders
      FROM orders
      WHERE status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
        AND (payment_method = 'COD' OR payment_status = 'PAID')
        AND created_at >= DATEADD(DAY, -@days, SYSUTCDATETIME())
    `, { days });

    const ev = res.recordset[0];
    const se = sessRes.recordset[0];
    const validOrders = Number(ordRes.recordset[0].valid_orders || 0);
    const uniqueVisitors = Number(ev.unique_visitors || 0);
    const prodViews = Number(ev.total_product_views || 0);
    const cartAdds = Number(ev.total_cart_adds || 0);

    return {
      periodDays: days,
      totalPageViews: Number(ev.total_page_views || 0),
      uniqueVisitors,
      newVisitors: Number(se.new_visitors || 0),
      returningVisitors: Number(se.returning_visitors || 0),
      totalProductViews: prodViews,
      totalCartAdds: cartAdds,
      validOrders,
      addToCartRate: prodViews > 0 ? Number(((cartAdds / prodViews) * 100).toFixed(2)) : 0,
      purchaseConversionRate: uniqueVisitors > 0 ? Number(((validOrders / uniqueVisitors) * 100).toFixed(2)) : 0,
      cartAbandonmentRate: cartAdds > 0 ? Number((Math.max(0, (cartAdds - validOrders) / cartAdds) * 100).toFixed(2)) : 0,
      avgSessionDurationSec: Math.round(Number(se.avg_duration_sec || 0)),
      avgProductsViewed: uniqueVisitors > 0 ? Number((prodViews / uniqueVisitors).toFixed(2)) : 0
    };
  }

  static async getConversionFunnel(days = 30) {
    const evRes = await query(`
      SELECT
        COUNT(DISTINCT session_id) AS website_visits,
        COUNT(DISTINCT CASE WHEN event_name = 'product_view' THEN session_id END) AS product_views,
        COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN session_id END) AS add_to_cart,
        COUNT(DISTINCT CASE WHEN event_name = 'checkout_start' THEN session_id END) AS checkout_start,
        COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN session_id END) AS purchase_events
      FROM user_events
      WHERE event_timestamp >= DATEADD(DAY, -@days, SYSUTCDATETIME())
    `, { days });
    return evRes.recordset[0];
  }

  static async getSearchAnalytics(days = 30) {
    const topRes = await query(`
      SELECT TOP 15 keyword, COUNT(*) AS search_count, AVG(result_count) AS avg_results
      FROM user_search_history
      WHERE created_at >= DATEADD(DAY, -@days, SYSUTCDATETIME()) AND LEN(keyword) > 0
      GROUP BY keyword
      ORDER BY search_count DESC
    `, { days });

    const noRes = await query(`
      SELECT TOP 10 keyword, COUNT(*) AS miss_count
      FROM user_search_history
      WHERE created_at >= DATEADD(DAY, -@days, SYSUTCDATETIME()) AND result_count = 0 AND LEN(keyword) > 0
      GROUP BY keyword
      ORDER BY miss_count DESC
    `, { days });

    return { topKeywords: topRes.recordset, noResultKeywords: noRes.recordset };
  }

  static async getTopBehaviorProducts(days = 30) {
    const res = await query(`
      SELECT TOP 15
        p.id AS product_id,
        p.name,
        c.name AS category_name,
        COALESCE(SUM(CASE WHEN ue.event_name = 'product_view' THEN 1 ELSE 0 END), 0) AS views,
        COALESCE(SUM(CASE WHEN ue.event_name = 'add_to_cart' THEN 1 ELSE 0 END), 0) AS cart_adds,
        (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS wishlist_count,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN product_variants pv ON oi.variant_id = pv.id
          WHERE pv.product_id = p.id
            AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
            AND (o.payment_method = 'COD' OR o.payment_status = 'PAID')
            AND o.created_at >= DATEADD(DAY, -@days, SYSUTCDATETIME())
        ), 0) AS units_sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN user_events ue ON p.id = ue.product_id AND ue.event_timestamp >= DATEADD(DAY, -@days, SYSUTCDATETIME())
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, c.name
      ORDER BY views DESC, units_sold DESC
    `, { days });
    return res.recordset;
  }

  static async getCustomerJourney(userId) {
    const summary = await query(`
      SELECT
        SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pages_viewed,
        SUM(CASE WHEN event_name = 'product_view' THEN 1 ELSE 0 END) AS products_viewed,
        SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS cart_adds
      FROM user_events
      WHERE user_id = @userId
    `, { userId });

    const orders = await query(`
      SELECT TOP 10 id, order_code, total_amount, status, payment_status, created_at
      FROM orders
      WHERE user_id = @userId
      ORDER BY created_at DESC
    `, { userId });

    return { summary: summary.recordset[0], recentOrders: orders.recordset };
  }

  // ====================================================================
  // AI DEMAND FORECASTING & LIFECYCLE ENDPOINTS
  // ====================================================================
  static async getCachedForecasts(days = 7) {
    const horizon = [7, 14, 30].includes(Number(days)) ? Number(days) : 7;
    const latestRes = await query(`SELECT TOP 1 forecast_base_date FROM ProductForecasts ORDER BY forecast_base_date DESC`);
    if (!latestRes.recordset.length) {
      return { forecastBaseDate: null, horizonDays: horizon, items: [] };
    }
    const baseDate = latestRes.recordset[0].forecast_base_date;

    const itemsRes = await query(`
      SELECT 
        pf.product_id,
        p.name AS product_name,
        c.name AS category_name,
        COALESCE((SELECT TOP 1 image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_thumbnail DESC, pi.id ASC), 'assets/card_1.jpg') AS image_url,
        COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) AS current_stock,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN product_variants pv ON oi.variant_id = pv.id
          WHERE pv.product_id = p.id
            AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
            AND (o.payment_method = 'COD' OR o.payment_status = 'PAID')
            AND o.created_at >= DATEADD(DAY, -7, SYSUTCDATETIME())
        ), 0) AS sales_last_7d,
        pf.forecast_base_date,
        pf.horizon_days,
        pf.target_date_end,
        CAST(pf.predicted_quantity AS FLOAT) AS predicted_quantity,
        CAST(pf.confidence_low AS FLOAT) AS confidence_low,
        CAST(pf.confidence_high AS FLOAT) AS confidence_high,
        pf.trend_direction,
        CAST(pf.growth_rate_percent AS FLOAT) AS growth_rate_percent,
        pf.recommended_restock_qty,
        pf.low_stock_risk,
        pf.model_version
      FROM ProductForecasts pf
      JOIN products p ON pf.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pf.forecast_base_date = @baseDate AND pf.horizon_days = @horizon
      ORDER BY pf.predicted_quantity DESC
    `, { baseDate, horizon });

    return {
      forecastBaseDate: baseDate,
      horizonDays: horizon,
      items: itemsRes.recordset
    };
  }

  static async getProductForecastDetail(productId) {
    const forecasts = await query(`
      SELECT TOP 3 horizon_days, forecast_base_date, target_date_end,
             CAST(predicted_quantity AS FLOAT) AS predicted_quantity,
             CAST(confidence_low AS FLOAT) AS confidence_low,
             CAST(confidence_high AS FLOAT) AS confidence_high,
             trend_direction, CAST(growth_rate_percent AS FLOAT) AS growth_rate_percent,
             recommended_restock_qty, low_stock_risk, model_version
      FROM ProductForecasts
      WHERE product_id = @productId
      ORDER BY forecast_base_date DESC, horizon_days ASC
    `, { productId });

    const history = await query(`
      SELECT TOP 30 metric_date, total_views, total_cart_adds, total_wishlist_adds,
             total_units_sold, CAST(total_revenue AS FLOAT) AS total_revenue,
             CAST(conversion_rate AS FLOAT) AS conversion_rate, stock_quantity, trend_anomaly_flag
      FROM ProductDailyMetrics
      WHERE product_id = @productId
      ORDER BY metric_date DESC
    `, { productId });

    return {
      forecasts: forecasts.recordset,
      dailyHistory: history.recordset.reverse()
    };
  }

  static async getModelPerformance() {
    const versions = await query(`
      SELECT id, model_version, model_type, training_date, dataset_start_date, dataset_end_date,
             train_metrics_json, val_metrics_json, test_metrics_json, status, is_production, notes
      FROM MLModelVersions
      ORDER BY training_date DESC
    `);

    const logs = await query(`
      SELECT TOP 15 run_id, trigger_type, model_version, status, dataset_rows,
             CAST(mae AS FLOAT) AS mae, CAST(rmse AS FLOAT) AS rmse,
             CAST(wape AS FLOAT) AS wape, CAST(forecast_bias AS FLOAT) AS forecast_bias,
             promoted, message, started_at
      FROM MLTrainingLogs
      ORDER BY started_at DESC
    `);

    const alerts = await query(`
      SELECT TOP 15 id, alert_type, severity, product_id, model_version,
             CAST(metric_value AS FLOAT) AS metric_value, CAST(threshold_value AS FLOAT) AS threshold_value,
             message, is_resolved, created_at
      FROM MLMonitoringAlerts
      ORDER BY is_resolved ASC, created_at DESC
    `);

    const evalComparison = await query(`
      SELECT TOP 20 pf.product_id, p.name AS product_name, pf.forecast_base_date, pf.horizon_days,
             CAST(pf.predicted_quantity AS FLOAT) AS predicted_quantity, pf.actual_quantity,
             CAST(pf.abs_error AS FLOAT) AS abs_error, pf.model_version, pf.evaluated_at
      FROM ProductForecasts pf
      JOIN products p ON pf.product_id = p.id
      WHERE pf.evaluated_at IS NOT NULL
      ORDER BY pf.evaluated_at DESC
    `);

    return {
      versions: versions.recordset,
      logs: logs.recordset,
      alerts: alerts.recordset,
      predictionVsActual: evalComparison.recordset
    };
  }

  static async rollbackModelVersion(targetVersion) {
    const check = await query(`SELECT model_version, status FROM MLModelVersions WHERE model_version = @ver`, { ver: targetVersion });
    if (!check.recordset.length) {
      const err = new Error(`Không tìm thấy model version "${targetVersion}"`);
      err.statusCode = 404;
      throw err;
    }

    await query(`
      UPDATE MLModelVersions SET is_production = 0, status = CASE WHEN is_production = 1 THEN 'ROLLED_BACK' ELSE status END, updated_at = SYSUTCDATETIME() WHERE is_production = 1;
      UPDATE MLModelVersions SET is_production = 1, status = 'ACTIVE', updated_at = SYSUTCDATETIME() WHERE model_version = @ver;
    `, { ver: targetVersion });

    return { rolledBackTo: targetVersion };
  }

  static async triggerPythonTrain(triggerType = 'MANUAL') {
    return callPythonAI('/api/ml/train', 'POST', { trigger_type: triggerType, force: false }, 30000);
  }

  static async triggerPythonPredict() {
    return callPythonAI('/api/ml/predict', 'POST', {}, 25000);
  }

  static async triggerPythonEvaluate() {
    return callPythonAI('/api/ml/evaluate', 'POST', {}, 20000);
  }
}

module.exports = AnalyticsService;

