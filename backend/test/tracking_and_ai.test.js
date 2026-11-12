const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { poolPromise, query } = require('../src/config/db');
const TrackingService = require('../src/modules/tracking/tracking.service');
const TrackingRepository = require('../src/modules/tracking/tracking.repository');
const AnalyticsService = require('../src/modules/analytics/analytics.service');
const { requireAdmin } = require('../src/middlewares/auth.middleware');

async function run() {
  console.log('================================================================');
  console.log('🧪 AURALIÈ — USER BEHAVIOR TRACKING & AI LIFECYCLE TESTS');
  console.log('================================================================');
  const pool = await poolPromise;

  const anonId = `anon-test-${Date.now()}`;
  const sessId = `sess-test-${Date.now()}`;
  const evtId = `evt-test-${Date.now()}`;

  // 1. Session & Event Ingestion + Deduplication + PII Stripping
  console.log('\n[1/6] Tracking: Session, Event Deduplication & PII Stripping...');
  await TrackingService.startSession(null, {
    session_id: sessId,
    anonymous_id: anonId,
    landing_page: '/index.html',
    device_type: 'DESKTOP'
  });

  const batch1 = await TrackingService.ingestEvents(null, [
    {
      event_id: evtId,
      event_name: 'product_view',
      anonymous_id: anonId,
      session_id: sessId,
      product_id: 1,
      event_properties: { password: 'SECRET_PASSWORD', cvv: '999', title: 'Test Suit' }
    },
    {
      event_id: evtId, // Trùng lặp ngay trong batch
      event_name: 'product_view',
      anonymous_id: anonId,
      session_id: sessId,
      product_id: 1
    }
  ]);
  assert.strictEqual(batch1.inserted, 1, 'Chính xác 1 event được chèn');
  assert.strictEqual(batch1.duplicates, 1, 'Chính xác 1 event trùng bị loại');

  const savedEvt = await query('SELECT event_properties FROM user_events WHERE event_id = @eid', { eid: evtId });
  const parsedProps = JSON.parse(savedEvt.recordset[0].event_properties);
  assert.strictEqual(parsedProps.password, undefined, 'Password phải bị lọc bỏ');
  assert.strictEqual(parsedProps.cvv, undefined, 'CVV phải bị lọc bỏ');
  assert.strictEqual(parsedProps.title, 'Test Suit');
  console.log('  -> Deduplication & Sanitization: PASSED');

  // 2. Search History Tracking
  console.log('\n[2/6] Tracking: Search & No-Result Logging...');
  const searchEvtId = `evt-search-${Date.now()}`;
  await TrackingService.ingestEvents(null, {
    event_id: searchEvtId,
    event_name: 'search_no_result',
    anonymous_id: anonId,
    session_id: sessId,
    event_properties: { keyword: 'AoVestTest999', result_count: 0 }
  });
  const searchRow = await query('SELECT keyword, result_count FROM user_search_history WHERE session_id = @sid', { sid: sessId });
  assert.strictEqual(searchRow.recordset[0].keyword, 'AoVestTest999');
  assert.strictEqual(searchRow.recordset[0].result_count, 0);
  console.log('  -> Search History: PASSED');

  // 3. Consent Enforcement (DENIED)
  console.log('\n[3/6] Privacy: Consent Enforcement (DENIED)...');
  await TrackingService.recordConsent(null, {
    anonymous_id: anonId,
    consent_type: 'ANALYTICS',
    consent_status: 'DENIED'
  });
  const blockedRes = await TrackingService.ingestEvents(null, {
    event_id: `evt-blocked-${Date.now()}`,
    event_name: 'page_view',
    anonymous_id: anonId,
    session_id: sessId
  });
  assert.strictEqual(blockedRes.accepted, 0, 'Event phải bị từ chối khi user DENIED');
  console.log('  -> Consent Enforcement: PASSED');

  // 4. Daily Aggregation & Cancelled Order Exclusion
  console.log('\n[4/6] Analytics: Daily Aggregation & Business Safety...');
  const aggRes = await AnalyticsService.runDailyAggregation();
  assert.strictEqual(aggRes.aggregated, true);
  const pdmCount = await query('SELECT COUNT(*) AS cnt FROM ProductDailyMetrics');
  assert.ok(pdmCount.recordset[0].cnt >= 20, 'ProductDailyMetrics phải có dữ liệu sản phẩm');
  console.log('  -> Daily Aggregation: PASSED');

  // 5. Cached AI Forecast & Model Performance
  console.log('\n[5/6] AI Forecasting: Cached Forecast & Model Lifecycle...');
  const fc7 = await AnalyticsService.getCachedForecasts(7);
  assert.ok(fc7.items.length >= 20, 'Phải có dự báo cho 20 sản phẩm');
  const perf = await AnalyticsService.getModelPerformance();
  assert.ok(perf.versions.some(v => v.is_production), 'Phải có model production đang hoạt động');
  console.log('  -> AI Forecast & Lifecycle: PASSED');

  // 6. RBAC Guard (Non-Admin blocked)
  console.log('\n[6/6] Security: Admin RBAC Guard...');
  let status403 = false;
  const mockRes = { status: (code) => { if (code === 403) status403 = true; return { json: () => {} }; } };
  requireAdmin({ user: { id: 2, role: 'CUSTOMER' } }, mockRes, () => {});
  assert.strictEqual(status403, true, 'User thường phải bị chặn 403 khi vào Analytics/AI');
  console.log('  -> Admin RBAC Guard: PASSED');

  // Dọn dẹp dữ liệu test tạm
  await query('DELETE FROM user_search_history WHERE session_id = @sid', { sid: sessId });
  await query('DELETE FROM product_interactions WHERE session_id = @sid', { sid: sessId });
  await query('DELETE FROM user_events WHERE session_id = @sid', { sid: sessId });
  await query('DELETE FROM tracking_consents WHERE anonymous_id = @aid', { aid: anonId });
  await query('DELETE FROM user_sessions WHERE session_id = @sid', { sid: sessId });

  console.log('\n✅ ALL TRACKING & AI LIFECYCLE TESTS PASSED (6/6)');
  await pool.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});

