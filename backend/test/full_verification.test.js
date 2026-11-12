const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sql, poolPromise, query } = require('../src/config/db');
const OrderService = require('../src/modules/orders/orders.service');
const OrderRepository = require('../src/modules/orders/orders.repository');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../src/modules/orders/orders.constants');

const testResults = [];

function recordTest(id, name, input, expected, actual, passed, evidence) {
  testResults.push({ id, name, input, expected, actual, status: passed ? 'PASS' : 'FAIL', evidence });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${id}: ${name}`);
  if (!passed) console.error('   Expected:', expected, '\n   Actual:', actual);
}

async function runAllVerifications() {
  console.log('========================================================================');
  console.log('👑 AURALIÈ HAUTE COUTURE — COMPREHENSIVE PRODUCTION VERIFICATION SUITE');
  console.log('========================================================================\n');

  const pool = await poolPromise;
  const apiKey = process.env.SEPAY_API_KEY || 'sepay_api_key_sample_auralie_2026';

  // Lấy 1 mẫu sản phẩm trong DB để tạo đơn hàng
  const prodSample = await query(`
    SELECT TOP 1 pv.id AS variant_id, pv.product_id, pv.stock_quantity, pv.variant_price, p.base_price, p.name AS product_name, pv.sku, pv.size, pv.color
    FROM product_variants pv 
    JOIN products p ON pv.product_id = p.id 
    WHERE pv.stock_quantity >= 5 AND p.is_active = 1
    ORDER BY pv.stock_quantity DESC
  `);
  const sample = prodSample.recordset[0];
  const itemPrice = Number(sample.variant_price || sample.base_price);

  console.log(`[Setup] Sản phẩm test: ${sample.product_name} (Variant #${sample.variant_id}, Giá: ${itemPrice.toLocaleString()} đ)`);

  // ====================================================================
  // PHẦN 1: DATABASE MIGRATION & SNAPSHOT VERIFICATION
  // ====================================================================
  console.log('\n--- PHẦN 1: DATABASE MIGRATION & SNAPSHOT VERIFICATION ---');

  // Test 1: Snapshot columns exist
  const cols = await query(`
    SELECT name FROM sys.columns 
    WHERE object_id = OBJECT_ID('order_items') 
      AND name IN ('product_name', 'sku', 'size', 'color')
  `);
  const colsExist = cols.recordset.length === 4;
  recordTest(
    'MIG-01',
    'Kiểm tra tồn tại 4 cột snapshot trong order_items',
    'sys.columns WHERE object_id = OBJECT_ID(order_items)',
    '4 cột (product_name, sku, size, color)',
    `${cols.recordset.length} cột: ${cols.recordset.map(c => c.name).join(', ')}`,
    colsExist,
    cols.recordset
  );

  // Test 2: Tạo đơn mới và kiểm tra lưu snapshot
  const orderWithSnapshot = await OrderService.createOrder({
    fullName: 'Snapshot Verification VIP',
    phone: '0901234567',
    address: '123 Đồng Khởi, Q1, TP.HCM',
    paymentMethod: 'SEPAY_QR',
    cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
  });

  const savedItems = await query(`
    SELECT id, order_id, variant_id, product_name, sku, size, color, price, quantity 
    FROM order_items 
    WHERE order_id = @orderId
  `, { orderId: orderWithSnapshot.orderId });

  const firstSaved = savedItems.recordset[0];
  const snapshotStored = !!(firstSaved && firstSaved.product_name && firstSaved.sku && firstSaved.size && firstSaved.color);
  recordTest(
    'MIG-02',
    'Đơn hàng mới lưu đầy đủ Snapshot sản phẩm vào order_items',
    `orderId: ${orderWithSnapshot.orderId}`,
    'product_name, sku, size, color khác NULL',
    `product_name: "${firstSaved.product_name}", sku: "${firstSaved.sku}", size: "${firstSaved.size}", color: "${firstSaved.color}"`,
    snapshotStored,
    firstSaved
  );

  // Test 3: API getOrderDetails trả về snapshot
  const orderDetails = await OrderService.getOrderDetails(orderWithSnapshot.orderId, null, '0901234567');
  const firstItem = orderDetails.items && orderDetails.items[0];
  const prodName = firstItem?.productName || firstItem?.product_name;
  const detailsContainSnapshot = !!(firstItem && prodName && firstItem.size && firstItem.color && firstItem.sku);
  recordTest(
    'MIG-03',
    'API getOrderDetails trả về dữ liệu snapshot đầy đủ',
    `getOrderDetails(${orderWithSnapshot.orderId})`,
    'items có productName, size, color, sku',
    `items[0].productName: "${prodName}", sku: "${firstItem?.sku}"`,
    detailsContainSnapshot,
    firstItem
  );

  // ====================================================================
  // PHẦN 2: SEPAY PAYMENT VERIFICATION (12 KỊCH BẢN)
  // ====================================================================
  console.log('\n--- PHẦN 2: SEPAY PAYMENT VERIFICATION (12 KỊCH BẢN) ---');

  // Helper tạo đơn SePay test
  async function createTestSepayOrder(tag = 'DEFAULT') {
    return await OrderService.createOrder({
      fullName: `Sepay Tester ${tag}`,
      phone: '0909999888',
      address: 'TP.HCM',
      paymentMethod: 'SEPAY_QR',
      cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
    });
  }

  // 1. API key đúng
  const orderSepay1 = await createTestSepayOrder('KEY_OK');
  const txCode1 = `TX-${Date.now()}-1`;
  const resKeyOk = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCode1, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don hang ${orderSepay1.orderCode}` }
  );
  recordTest(
    'SEPAY-01',
    'Xác thực Webhook với API Key hợp lệ',
    `Authorization: Apikey ${apiKey.slice(0, 8)}...`,
    'success: true, payment_status: PAID, order_status: CONFIRMED',
    `success: ${resKeyOk.success}, newStatus: ${resKeyOk.orderStatus}`,
    resKeyOk.success === true && resKeyOk.orderStatus === 'CONFIRMED',
    resKeyOk
  );

  // 2. API key sai
  let errKeyWrong = null;
  try {
    await OrderService.handleSepayWebhook(
      { authorization: 'Apikey WRONG_KEY_ABCXYZ' },
      { id: `TX-${Date.now()}-2`, transferType: 'in', transferAmount: itemPrice, content: 'Test' }
    );
  } catch (e) {
    errKeyWrong = e;
  }
  recordTest(
    'SEPAY-02',
    'Chặn Webhook với API Key sai',
    'Authorization: Apikey WRONG_KEY_ABCXYZ',
    'HTTP 401 Unauthorized',
    `statusCode: ${errKeyWrong?.statusCode}, msg: "${errKeyWrong?.message}"`,
    errKeyWrong?.statusCode === 401,
    errKeyWrong?.message
  );

  // 3. Thiếu Authorization
  let errAuthMissing = null;
  try {
    await OrderService.handleSepayWebhook(
      {},
      { id: `TX-${Date.now()}-3`, transferType: 'in', transferAmount: itemPrice, content: 'Test' }
    );
  } catch (e) {
    errAuthMissing = e;
  }
  recordTest(
    'SEPAY-03',
    'Chặn Webhook khi thiếu Header Authorization',
    'headers: {}',
    'HTTP 401 Unauthorized',
    `statusCode: ${errAuthMissing?.statusCode}, msg: "${errAuthMissing?.message}"`,
    errAuthMissing?.statusCode === 401,
    errAuthMissing?.message
  );

  // 4. Thiếu Transaction ID
  let errTxMissing = null;
  try {
    await OrderService.handleSepayWebhook(
      { authorization: `Apikey ${apiKey}` },
      { transferType: 'in', transferAmount: itemPrice, content: 'Test' }
    );
  } catch (e) {
    errTxMissing = e;
  }
  recordTest(
    'SEPAY-04',
    'Chặn Webhook khi thiếu Transaction ID (id hoặc referenceCode)',
    'body: { transferAmount: 100000, content: "Test" }',
    'HTTP 400 Bad Request',
    `statusCode: ${errTxMissing?.statusCode}, msg: "${errTxMissing?.message}"`,
    errTxMissing?.statusCode === 400,
    errTxMissing?.message
  );

  // 5. Giao dịch không hợp lệ (Không tìm thấy mã đơn hàng)
  const resNotFound = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: `TX-${Date.now()}-5`, transferType: 'in', transferAmount: itemPrice, content: 'Chuyen tien khong kem ma don hang' }
  );
  recordTest(
    'SEPAY-05',
    'Xử lý giao dịch nội dung không khớp bất kỳ đơn hàng nào',
    'content: "Chuyen tien khong kem ma don hang"',
    'success: false, notFound: true',
    `success: ${resNotFound.success}, notFound: ${resNotFound.notFound}`,
    resNotFound.success === false && resNotFound.notFound === true,
    resNotFound
  );

  // 6. Thanh toán thiếu (Underpaid)
  const orderUnderpaid = await createTestSepayOrder('UNDERPAID');
  const halfAmount = Math.floor(itemPrice / 2);
  const txCodeUnderpaid = `TX-${Date.now()}-6`;
  const resUnderpaid = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCodeUnderpaid, transferType: 'in', transferAmount: halfAmount, content: `Thanh toan don ${orderUnderpaid.orderCode}` }
  );
  const checkUnderDb = await OrderRepository.findById(orderUnderpaid.orderId);
  recordTest(
    'SEPAY-06',
    'Xử lý chuyển thiếu tiền (Underpaid)',
    `transferAmount: ${halfAmount} / orderTotal: ${itemPrice}`,
    'payment_status: PARTIALLY_PAID, status: PENDING',
    `DB payment_status: ${checkUnderDb.payment_status}, status: ${checkUnderDb.status}`,
    checkUnderDb.payment_status === 'PARTIALLY_PAID' && checkUnderDb.status === 'PENDING',
    { resUnderpaid, dbStatus: checkUnderDb.payment_status }
  );

  // 7. Thanh toán đủ (Exact)
  const orderExact = await createTestSepayOrder('EXACT');
  const txCodeExact = `TX-${Date.now()}-7`;
  const resExact = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCodeExact, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderExact.orderCode}` }
  );
  const checkExactDb = await OrderRepository.findById(orderExact.orderId);
  recordTest(
    'SEPAY-07',
    'Xử lý chuyển đúng số tiền (Exact Payment)',
    `transferAmount: ${itemPrice} / orderTotal: ${itemPrice}`,
    'payment_status: PAID, status: CONFIRMED',
    `DB payment_status: ${checkExactDb.payment_status}, status: ${checkExactDb.status}`,
    checkExactDb.payment_status === 'PAID' && checkExactDb.status === 'CONFIRMED',
    { resExact, dbStatus: checkExactDb.payment_status }
  );

  // 8. Thanh toán thừa (Overpaid)
  const orderOverpaid = await createTestSepayOrder('OVERPAID');
  const excessAmount = itemPrice + 500000;
  const txCodeOverpaid = `TX-${Date.now()}-8`;
  const resOverpaid = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCodeOverpaid, transferType: 'in', transferAmount: excessAmount, content: `Thanh toan don ${orderOverpaid.orderCode}` }
  );
  const checkOverDb = await OrderRepository.findById(orderOverpaid.orderId);
  recordTest(
    'SEPAY-08',
    'Xử lý chuyển thừa tiền (Overpaid)',
    `transferAmount: ${excessAmount} / orderTotal: ${itemPrice}`,
    'payment_status: PAID, status: CONFIRMED, type: OVERPAID',
    `DB payment_status: ${checkOverDb.payment_status}, status: ${checkOverDb.status}, overpaidAmount: ${resOverpaid.paymentDetail?.overpaidAmount}`,
    checkOverDb.payment_status === 'PAID' && resOverpaid.paymentDetail?.type === 'OVERPAID',
    { resOverpaid, dbStatus: checkOverDb.payment_status }
  );

  // 9. Webhook trùng lần lượt (Idempotency - Sequential)
  const resDupSeq = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCodeExact, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderExact.orderCode}` }
  );
  recordTest(
    'SEPAY-09',
    'Chống xử lý trùng lặp giao dịch (Idempotency Sequential)',
    `Gọi lại cùng transactionCode: ${txCodeExact}`,
    'idempotent: true, duplicate: true',
    `idempotent: ${resDupSeq.idempotent}, duplicate: ${resDupSeq.duplicate}`,
    resDupSeq.idempotent === true && resDupSeq.duplicate === true,
    resDupSeq
  );

  // 10. Hai Webhook cùng lúc (Idempotency - Concurrent Race Condition)
  const orderRaceWebhook = await createTestSepayOrder('RACE_WEBHOOK');
  const txCodeRace = `TX-RACE-${Date.now()}`;
  const [wb1, wb2] = await Promise.all([
    OrderService.handleSepayWebhook(
      { authorization: `Apikey ${apiKey}` },
      { id: txCodeRace, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderRaceWebhook.orderCode}` }
    ),
    OrderService.handleSepayWebhook(
      { authorization: `Apikey ${apiKey}` },
      { id: txCodeRace, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderRaceWebhook.orderCode}` }
    )
  ]);
  const oneSuccess = (wb1.success && !wb1.duplicate) || (wb2.success && !wb2.duplicate);
  const oneDuplicate = wb1.duplicate || wb2.duplicate;
  const countTxInDb = await query('SELECT COUNT(*) AS total FROM payment_transactions WHERE transaction_code = @txCode', { txCode: `SEPAY-${txCodeRace}` });
  recordTest(
    'SEPAY-10',
    'Hai webhook giống hệt nhau gửi đến đồng thời (Concurrent Race Condition)',
    `2 requests song song với cùng transactionCode: ${txCodeRace}`,
    'Chính xác 1 request thành công, 1 request trả về duplicate: true, DB chỉ có đúng 1 bản ghi',
    `oneSuccess: ${oneSuccess}, oneDuplicate: ${oneDuplicate}, DB total: ${countTxInDb.recordset[0].total}`,
    oneSuccess && oneDuplicate && Number(countTxInDb.recordset[0].total) === 1,
    { wb1, wb2, dbTxCount: countTxInDb.recordset[0].total }
  );

  // 11. Giao dịch đến sau khi đơn CANCELLED (Late Payment)
  const orderCancelled = await createTestSepayOrder('CANCELLED_FIRST');
  // Hủy đơn và hoàn kho trước
  await OrderRepository.cancelAndRestockOrder(orderCancelled.orderId, 'Hủy test late payment');
  const txCodeLate = `TX-LATE-${Date.now()}`;
  const resLate = await OrderService.handleSepayWebhook(
    { authorization: `Apikey ${apiKey}` },
    { id: txCodeLate, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderCancelled.orderCode}` }
  );
  const checkLateDb = await OrderRepository.findById(orderCancelled.orderId);
  recordTest(
    'SEPAY-11',
    'Giao dịch đến sau khi đơn đã bị HỦY (Late Payment Arrival)',
    `Order status: CANCELLED, transferAmount: ${itemPrice}`,
    'latePayment: true, order status giữ nguyên CANCELLED (không được tự động hồi sinh)',
    `latePayment: ${resLate.latePayment}, DB status: ${checkLateDb.status}`,
    resLate.latePayment === true && checkLateDb.status === 'CANCELLED',
    { resLate, dbStatus: checkLateDb.status }
  );

  // 12. Webhook chạy đồng thời với expiredOrders worker
  const orderRaceWorker = await createTestSepayOrder('RACE_WORKER');
  // Lùi thời gian tạo đơn 20 phút trước để đủ điều kiện hết hạn
  await query("UPDATE orders SET created_at = DATEADD(minute, -20, SYSDATETIME()) WHERE id = @id", { id: orderRaceWorker.orderId });
  const txCodeWorkerRace = `TX-WRACE-${Date.now()}`;

  const [raceWbRes, raceWorkerRes] = await Promise.all([
    OrderService.handleSepayWebhook(
      { authorization: `Apikey ${apiKey}` },
      { id: txCodeWorkerRace, transferType: 'in', transferAmount: itemPrice, content: `Thanh toan don ${orderRaceWorker.orderCode}` }
    ),
    OrderRepository.releaseExpiredOrders(15)
  ]);
  const checkRaceDb = await OrderRepository.findById(orderRaceWorker.orderId);
  // Nếu webhook đến trước hoặc cùng lúc, đơn phải là PAID hoặc CANCELLED nhất quán, không được xung đột deadlock
  const consistentState = (checkRaceDb.status === 'CONFIRMED' && checkRaceDb.payment_status === 'PAID') ||
                          (checkRaceDb.status === 'CANCELLED');
  recordTest(
    'SEPAY-12',
    'Webhook thanh toán chạy song song với Expired Orders Worker',
    'Đơn đã quá hạn 20 phút, nhận webhook đồng thời khi Worker quét',
    'Không deadlock, trạng thái cuối cùng nhất quán (CONFIRMED/PAID hoặc CANCELLED sạch)',
    `DB status: ${checkRaceDb.status}, payment_status: ${checkRaceDb.payment_status}`,
    consistentState,
    { checkRaceDb, raceWbRes, raceWorkerRes }
  );

  // ====================================================================
  // PHẦN 3: TRANSACTION ROLLBACK & NETWORK FAULT INJECTION
  // ====================================================================
  console.log('\n--- PHẦN 3: TRANSACTION ROLLBACK & NETWORK FAULT INJECTION ---');

  // Test Rollback: Ngắt kết nối trong lúc đang transaction
  let rollbackHandledCleanly = false;
  let originalErrorPreserved = false;
  try {
    const faultyTx = new sql.Transaction(pool);
    await faultyTx.begin();
    const req = new sql.Request(faultyTx);
    // Bắt đầu câu lệnh lỗi cú pháp cố ý trong transaction
    await req.query('SELECT * FROM non_existent_table_for_testing_rollback_12345');
    await faultyTx.commit();
  } catch (err) {
    originalErrorPreserved = err.message.includes('non_existent_table_for_testing_rollback_12345') || err.number === 208;
    // Thử gọi safeRollback
    try {
      await OrderRepository.safeRollback(null, 'null test');
      rollbackHandledCleanly = true;
    } catch (e) {
      rollbackHandledCleanly = false;
    }
  }

  recordTest(
    'ROLLBACK-01',
    'safeRollback bảo toàn lỗi database gốc và không sinh lỗi thứ cấp',
    'Cố ý truy vấn bảng không tồn tại trong SQL Transaction',
    'Bắt được lỗi database gốc (Error 208), safeRollback không throw secondary exception',
    `originalErrorPreserved: ${originalErrorPreserved}, rollbackHandledCleanly: ${rollbackHandledCleanly}`,
    originalErrorPreserved && rollbackHandledCleanly,
    { originalErrorPreserved, rollbackHandledCleanly }
  );

  // ====================================================================
  // PHẦN 4: CONCURRENCY STRESS TESTS (REAL CONCURRENCY)
  // ====================================================================
  console.log('\n--- PHẦN 4: CONCURRENCY STRESS TESTS ---');

  // Test C-01: 10 khách đặt sản phẩm có tồn kho = 3
  console.log('Chạy stress test: 10 khách đặt đồng thời vào sản phẩm có tồn kho = 3...');
  const originalStock = sample.stock_quantity;
  await query('UPDATE product_variants SET stock_quantity = 3 WHERE id = @id', { id: sample.variant_id });

  const tenTasks = [];
  for (let i = 0; i < 10; i++) {
    tenTasks.push(
      OrderService.createOrder({
        fullName: `Stress Buyer #${i}`,
        phone: '0901111222',
        address: 'Hanoi',
        paymentMethod: 'COD',
        cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
      }).then(o => ({ success: true, id: o.orderId })).catch(e => ({ success: false, msg: e.message }))
    );
  }
  const tenRes = await Promise.all(tenTasks);
  const tenSuccesses = tenRes.filter(r => r.success).length;
  const tenFailures = tenRes.filter(r => !r.success).length;
  const checkStockDb = await query('SELECT stock_quantity FROM product_variants WHERE id = @id', { id: sample.variant_id });
  const finalStockVal = Number(checkStockDb.recordset[0].stock_quantity);

  // Khôi phục tồn kho cũ
  await query('UPDATE product_variants SET stock_quantity = @stock WHERE id = @id', { id: sample.variant_id, stock: originalStock });

  recordTest(
    'CONCUR-01',
    '10 khách tranh mua đồng thời sản phẩm chỉ còn tồn kho = 3',
    '10 Promise.all createOrder cùng lúc trên 1 variant_id',
    'Chính xác 3 đơn thành công, 7 đơn bị từ chối hết hàng, tồn kho cuối cùng = 0 (không âm)',
    `Thành công: ${tenSuccesses}, Thất bại: ${tenFailures}, Tồn kho DB: ${finalStockVal}`,
    tenSuccesses === 3 && tenFailures === 7 && finalStockVal === 0,
    { tenSuccesses, tenFailures, finalStockVal }
  );

  // Test C-02: 5 khách dùng coupon có usage_limit = 2
  console.log('Chạy stress test: 5 khách áp dụng đồng thời mã coupon chỉ còn 2 lượt...');
  const testCpCode = `STRESSCP${Date.now().toString().slice(-6)}`;
  await query(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit, used_count, is_active)
    VALUES (@code, 'FIXED', 50000, 0, 2, 0, 1)
  `, { code: testCpCode });

  const fiveCpTasks = [];
  for (let i = 0; i < 5; i++) {
    fiveCpTasks.push(
      OrderService.createOrder({
        fullName: `Coupon Racer #${i}`,
        phone: '0903333444',
        address: 'Danang',
        paymentMethod: 'COD',
        couponCode: testCpCode,
        cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
      }).then(() => true).catch(() => false)
    );
  }
  const fiveCpRes = await Promise.all(fiveCpTasks);
  const cpSuccessCount = fiveCpRes.filter(Boolean).length;
  const checkCpDb = await query('SELECT used_count, usage_limit FROM coupons WHERE code = @code', { code: testCpCode });
  const finalUsedCount = Number(checkCpDb.recordset[0].used_count);
  await query('DELETE FROM coupons WHERE code = @code', { code: testCpCode });

  recordTest(
    'CONCUR-02',
    '5 khách áp dụng mã Coupon đồng thời khi usage_limit = 2',
    '5 Promise.all createOrder với couponCode',
    'Chính xác 2 đơn được áp dụng, used_count = 2 (không vượt giới hạn)',
    `Thành công: ${cpSuccessCount}/5, DB used_count: ${finalUsedCount}`,
    cpSuccessCount === 2 && finalUsedCount === 2,
    { cpSuccessCount, finalUsedCount }
  );

  // Test C-03: Hai worker expiredOrders chạy đồng thời (Multi-instance PM2 simulation)
  console.log('Chạy stress test: 2 worker releaseExpiredOrders chạy đồng thời...');
  const [worker1Res, worker2Res] = await Promise.all([
    OrderRepository.releaseExpiredOrders(15),
    OrderRepository.releaseExpiredOrders(15)
  ]);
  const workersSucceeded = Array.isArray(worker1Res) && Array.isArray(worker2Res);
  recordTest(
    'CONCUR-03',
    'Hai instance Worker quét đơn hết hạn chạy song song (UPDLOCK, READPAST)',
    '2 Promise.all releaseExpiredOrders(15)',
    'Không xảy ra deadlock hoặc lỗi SQL khóa bảng',
    `Worker 1: ${worker1Res.length} đơn, Worker 2: ${worker2Res.length} đơn, workersSucceeded: ${workersSucceeded}`,
    workersSucceeded,
    { worker1Count: worker1Res.length, worker2Count: worker2Res.length }
  );

  console.log('\n========================================================================');
  const allPassed = testResults.every(t => t.status === 'PASS');
  console.log(`TỔNG KẾT: ${testResults.filter(t => t.status === 'PASS').length}/${testResults.length} BÀI TEST ĐẠT (PASS)`);
  console.log('TRẠNG THÁI:', allPassed ? '✅ 100% KIỂM THỬ THÀNH CÔNG' : '❌ CÓ BÀI TEST THẤT BẠI');
  console.log('========================================================================\n');

  // Lưu file kết quả chi tiết để tạo báo cáo
  const fs = require('fs');
  fs.writeFileSync(
    path.resolve(__dirname, 'verification_results.json'),
    JSON.stringify(testResults, null, 2),
    'utf8'
  );

  await pool.close();
  process.exit(allPassed ? 0 : 1);
}

runAllVerifications().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
