const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sql, poolPromise, query } = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');
const AuthService = require('../src/modules/auth/auth.service');
const OrderService = require('../src/modules/orders/orders.service');
const OrderRepository = require('../src/modules/orders/orders.repository');
const { OrderStateMachine } = require('../src/modules/orders/orders.state-machine');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../src/modules/orders/orders.constants');

async function run() {
  console.log('================================================================');
  console.log('👑 AURALIÈ HAUTE COUTURE — AUTOMATED REGRESSION & INTEGRATION TESTS');
  console.log('================================================================');

  const pool = await poolPromise;

  // 1. UNIT TEST: State Machine Transitions
  console.log('\n[1/4] Unit Test: Order State Machine Transitions...');
  assert.ok(OrderStateMachine.validateTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED));
  assert.ok(OrderStateMachine.validateTransition(ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING));
  assert.ok(OrderStateMachine.validateTransition(ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, { payment_method: 'COD' }));
  assert.ok(OrderStateMachine.validateTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED));

  let illegalBlocked = false;
  try { OrderStateMachine.validateTransition(ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED); } catch (e) { illegalBlocked = true; }
  assert.ok(illegalBlocked, 'COMPLETED to CANCELLED must be blocked');
  console.log('  -> State Machine Guards: PASSED');

  // 2. INTEGRATION: User, Order & Backend Pricing
  console.log('\n[2/4] Integration Test: Pricing & Order Creation...');
  const testEmail = `test.auto.${Date.now()}@auralie.com`;
  const regUser = await AuthService.register({
    fullName: 'Test Automation VIP',
    email: testEmail,
    password: 'Password2026@',
    phone: '0908888111',
    address: 'Q1, TP.HCM'
  });

  const prodSample = await query('SELECT TOP 1 pv.id AS variant_id, pv.product_id, pv.stock_quantity, pv.variant_price, p.base_price FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.stock_quantity >= 5 AND p.is_active = 1');
  const sample = prodSample.recordset[0];
  const itemPrice = Number(sample.variant_price || sample.base_price);

  const order = await OrderService.createOrder({
    fullName: 'Test Automation VIP',
    phone: '0908888111',
    address: 'Q1, TP.HCM',
    paymentMethod: 'COD',
    cartItems: [{ variantId: sample.variant_id, quantity: 1, price: 100 }], // tampered price
    user: { id: regUser.user.id }
  });

  assert.strictEqual(order.totalAmount, itemPrice, 'Backend price must override client price');
  assert.strictEqual(order.status, 'CONFIRMED');

  const myOrders = await OrderService.getMyOrders(regUser.user.id);
  assert.ok(myOrders.items.some(o => o.order_code === order.orderCode));
  console.log('  -> Order & Pricing Integration: PASSED');

  // 3. SECURITY & IDOR: Other user blocked
  console.log('\n[3/4] Security Test: IDOR Protection...');
  let idorCaught = false;
  try {
    await OrderService.getOrderDetails(order.orderId, { id: 999999, role: 'CUSTOMER' });
  } catch (e) {
    idorCaught = true;
    assert.strictEqual(e.statusCode, 403);
  }
  assert.ok(idorCaught, 'Cross-user order access must be forbidden');
  console.log('  -> IDOR Guard: PASSED');

  // 4. CONCURRENCY: Stock depletion integrity
  console.log('\n[4/4] Concurrency Test: Competing for 2 items with 5 orders...');
  const originalStock = sample.stock_quantity;
  await query('UPDATE product_variants SET stock_quantity = 2 WHERE id = @id', { id: sample.variant_id });

  const tasks = [];
  for (let i = 0; i < 5; i++) {
    tasks.push(
      OrderService.createOrder({
        fullName: `Concurrency User #${i}`,
        phone: '0908888999',
        address: 'Hanoi',
        paymentMethod: 'COD',
        cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
      }).then(() => true).catch((err) => {
        console.error(`Task ${i} error:`, err?.message || err);
        return false;
      })
    );
  }
  const taskRes = await Promise.all(tasks);
  const successes = taskRes.filter(Boolean).length;
  assert.strictEqual(successes, 2, 'Exactly 2 orders should succeed');

  const finalStock = await query('SELECT stock_quantity FROM product_variants WHERE id = @id', { id: sample.variant_id });
  assert.strictEqual(Number(finalStock.recordset[0].stock_quantity), 0, 'Stock cannot be negative');

  // Restore stock
  await query('UPDATE product_variants SET stock_quantity = @stock WHERE id = @id', { id: sample.variant_id, stock: originalStock });
  console.log('  -> Concurrency & Non-negative Stock: PASSED');

  // 5. CONCURRENCY: Coupon Usage Limit Under Race Condition
  console.log('\n[5/5] Concurrency Test: Coupon usage limit (5 orders competing for limit = 2)...');
  const testCouponCode = `TESTCP${Date.now().toString().slice(-6)}`;
  await query(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit, used_count, is_active)
    VALUES (@code, 'FIXED', 100000, 0, 2, 0, 1)
  `, { code: testCouponCode });

  const couponTasks = [];
  for (let i = 0; i < 5; i++) {
    couponTasks.push(
      OrderService.createOrder({
        fullName: `Coupon Racer #${i}`,
        phone: '0908888999',
        address: 'Hanoi',
        paymentMethod: 'COD',
        couponCode: testCouponCode,
        cartItems: [{ variantId: sample.variant_id, quantity: 1, price: itemPrice }]
      }).then(() => true).catch((err) => {
        console.error(`Coupon task ${i} error:`, err?.message || err);
        return false;
      })
    );
  }

  const cpRes = await Promise.all(couponTasks);
  const cpSuccessCount = cpRes.filter(Boolean).length;
  assert.strictEqual(cpSuccessCount, 2, 'Chính xác chỉ có 2 đơn được áp dụng coupon');

  const checkCpDb = await query('SELECT used_count, usage_limit FROM coupons WHERE code = @code', { code: testCouponCode });
  assert.strictEqual(checkCpDb.recordset[0].used_count, 2, 'used_count không được vượt quá usage_limit');

  // Dọn dẹp coupon test
  await query('DELETE FROM coupons WHERE code = @code', { code: testCouponCode });
  console.log('  -> Concurrency Coupon Limit: PASSED');

  console.log('\n================================================================');
  console.log('✅ ALL TEST SUITES PASSED (100%)');
  console.log('================================================================');

  await pool.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});

