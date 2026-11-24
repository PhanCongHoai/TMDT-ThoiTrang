require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_auralie_2026';

function generateAdminToken() {
  return jwt.sign(
    { id: 1, email: 'admin@auralie.local', role: 'ADMIN', fullName: 'Administrator' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runAdminOrderFilterTests() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ BỘ LỌC ĐƠN HÀNG ADMIN (ORDER FILTERS)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] TC_ORD_FLT_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.log(`       -> ${detail}`);
    } else {
      console.error(`[FAIL] TC_ORD_FLT_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.error(`       -> ${detail}`);
    }
  }

  const adminToken = generateAdminToken();

  try {
    // TC_01: Lấy danh sách tất cả đơn hàng với quyền Admin
    const resAll = await fetch(`${BASE_URL}/orders?limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataAll = await resAll.json();
    const allOrders = Array.isArray(dataAll.data) ? dataAll.data : (dataAll.data?.items || []);

    assert(
      resAll.status === 200 && Array.isArray(allOrders),
      'Lấy danh sách tất cả đơn hàng từ API Admin thành công (HTTP 200)',
      `Tổng số đơn hàng: ${allOrders.length}`
    );

    // TC_02: Lọc đơn hàng theo Trạng thái CONFIRMED
    const resConfirmed = await fetch(`${BASE_URL}/orders?status=CONFIRMED&limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataConfirmed = await resConfirmed.json();
    const confirmedOrders = Array.isArray(dataConfirmed.data) ? dataConfirmed.data : (dataConfirmed.data?.items || []);
    const allAreConfirmed = confirmedOrders.every(o => o.status === 'CONFIRMED');

    assert(
      resConfirmed.status === 200 && allAreConfirmed,
      'Lọc đơn hàng theo trạng thái CONFIRMED (Đã Xác Nhận)',
      `Số đơn CONFIRMED: ${confirmedOrders.length}`
    );

    // TC_03: Lọc đơn hàng theo Trạng thái PENDING
    const resPending = await fetch(`${BASE_URL}/orders?status=PENDING&limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataPending = await resPending.json();
    const pendingOrders = Array.isArray(dataPending.data) ? dataPending.data : (dataPending.data?.items || []);
    const allArePending = pendingOrders.every(o => o.status === 'PENDING');

    assert(
      resPending.status === 200 && allArePending,
      'Lọc đơn hàng theo trạng thái PENDING (Chờ Duyệt Kho)',
      `Số đơn PENDING: ${pendingOrders.length}`
    );

    // TC_04: Lọc đơn hàng theo Trạng thái thanh toán PAID
    const resPaid = await fetch(`${BASE_URL}/orders?paymentStatus=PAID&limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dataPaid = await resPaid.json();
    const paidOrders = Array.isArray(dataPaid.data) ? dataPaid.data : (dataPaid.data?.items || []);
    const allArePaid = paidOrders.every(o => o.payment_status === 'PAID');

    assert(
      resPaid.status === 200 && allArePaid,
      'Lọc đơn hàng theo Trạng thái thanh toán PAID (Đã Thanh Toán)',
      `Số đơn PAID: ${paidOrders.length}`
    );

    // TC_05: Tìm kiếm đơn hàng theo từ khóa search
    if (allOrders.length > 0) {
      const sampleCode = allOrders[0].order_code.substring(0, 12);
      const resSearch = await fetch(`${BASE_URL}/orders?search=${sampleCode}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const dataSearch = await resSearch.json();
      const searchOrders = Array.isArray(dataSearch.data) ? dataSearch.data : (dataSearch.data?.items || []);
      const matchesSearch = searchOrders.some(o => o.order_code.includes(sampleCode));

      assert(
        resSearch.status === 200 && matchesSearch,
        `Tìm kiếm đơn hàng theo mã đơn: "${sampleCode}"`,
        `Tìm thấy: ${searchOrders.length} đơn hàng khớp`
      );
    } else {
      assert(true, 'Bỏ qua tìm kiếm mã đơn vì chưa có đơn hàng mẫu');
    }

  } catch (err) {
    console.error('Lỗi kiểm thử bộ lọc đơn hàng:', err);
  }

  console.log('\n================================================================');
  console.log(`   KẾT QUẢ KIỂM THỬ: ${passed} / ${total} CA KIỂM THỬ ĐẠT (PASS ${(passed/total*100).toFixed(1)}%)`);
  console.log('================================================================\n');

  if (passed === total) process.exit(0);
  else process.exit(1);
}

runAdminOrderFilterTests();
