// Isolated tests: replace repository/config dependencies before loading the service.
// This file never imports the database driver and never connects to SQL Server.
const assert = require('node:assert/strict');
const path = require('node:path');
const moduleDirectory = path.resolve(__dirname, '../src/modules/orders');
const order = {
  id: 17, user_id: 3, order_code: 'TEST-17', customer_name: 'Current profile name',
  phone_number: '0912345678', shipping_address: '123 Real Street, Ward 1, Test City',
  total_amount: 500000, status: 'CANCELLED', payment_status: 'UNPAID', payment_method: 'COD', tracking_code: null
};
let repositoryCalls = 0;
const repository = {
  async findByOrderCode() { repositoryCalls++; return order; },
  async findById() { repositoryCalls++; return order; },
  async getOrderItems() { return [{ id: 1, variant_id: 12, product_id: 7, product_name: 'Snapshot Dress', size: 'M', color: 'Black', quantity: 2, price: 250000 }]; }
};
function mock(file, exports) { require.cache[require.resolve(file)] = { id:file, filename:file, loaded:true, exports }; }
mock(path.join(moduleDirectory, 'orders.repository.js'), repository);
mock(path.resolve(moduleDirectory, '../../config/db.js'), { query() { throw new Error('Unexpected database access'); } });
mock(path.resolve(moduleDirectory, '../../config/env.js'), { SEPAY: {} });
const Service = require(path.join(moduleDirectory, 'orders.service.js'));

async function main() {
  await assert.rejects(Service.createOrder({ items: [{id:1,qty:1}] }), error => error.statusCode === 401);
  assert.equal(repositoryCalls, 0);
  console.log('PASS anonymous checkout is rejected before repository access');
  const owner = await Service.trackOrder('TEST-17', null, {id:3,role:'CUSTOMER'});
  assert.equal(owner.shippingAddress, order.shipping_address);
  assert.equal(owner.phoneNumber, order.phone_number);
  assert.equal(owner.isFullyVerified, true);
  assert.equal(owner.trackingCode, null);
  assert.equal(owner.carrier, null);
  assert.equal(owner.statusText, 'Đã hủy');
  console.log('PASS owner gets stored shipping data and truthful cancelled status');
  const other = await Service.trackOrder('TEST-17', null, {id:4,role:'CUSTOMER'});
  assert.equal(other.isFullyVerified, false);
  assert.notEqual(other.phoneNumber, order.phone_number);
  assert.notEqual(other.shippingAddress, order.shipping_address);
  assert.equal(other.customerName, null);
  const verified = await Service.trackOrder('TEST-17', '0912345678');
  assert.equal(verified.shippingAddress, order.shipping_address);
  assert.equal(verified.phoneNumber, order.phone_number);
  console.log('PASS third-party details stay masked until phone verification');
  const details = await Service.getOrderDetails(17, {id:3,role:'CUSTOMER'});
  assert.equal(details.items[0].productId, 7);
  assert.equal(details.items[0].variantId, 12);
  await assert.rejects(Service.getOrderDetails(17, {id:4,role:'CUSTOMER'}), error => error.statusCode === 403);
  console.log('PASS reorder details contain product/variant IDs and enforce ownership');
  for (const stock of [null, undefined, 0]) {
    repository.resolveItemDetails=async()=>({product_active:1,product_name:'Unstocked Product',stock_quantity:stock,size:'M',color:'Black'});
    await assert.rejects(Service.createOrder({user:{id:3},items:[{id:1,qty:1}]}),error=>error.statusCode===400 && error.message.includes('không đủ tồn kho'));
  }
  console.log('PASS checkout rejects zero/missing stock instead of treating it as unlimited');
  console.log('All isolated checks passed; no database connection was made.');
}
main().catch(error => { console.error(error); process.exitCode=1; });
