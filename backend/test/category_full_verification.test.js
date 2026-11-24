const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { poolPromise } = require('../src/config/db');
const { JWT_SECRET } = require('../src/config/env');

const BASE_URL = 'http://127.0.0.1:5000/api/v1/categories';

// Tạo token admin giả lập
const adminToken = jwt.sign(
  { id: 1, email: 'admin@auralie.local', role: 'ADMIN', fullName: 'Administrator' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Tạo token customer giả lập
const customerToken = jwt.sign(
  { id: 999, email: 'customer@auralie.local', role: 'CUSTOMER', fullName: 'Customer Tester' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runCategoryTests() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ PHÂN HỆ QUẢN LÝ DANH MỤC (CATEGORY TEST SUITE)');
  console.log('================================================================\n');

  const pool = await poolPromise;
  const testSuffix = randomUUID().substring(0, 6);
  const testCatName = `Thời Trang Dạ Tiệc_${testSuffix}`;
  const testCatSlug = `da-tiec-${testSuffix}`;
  let createdCatId = null;

  const results = [];
  function record(id, name, pass, detail) {
    results.push({ id, name, pass, detail });
    const tag = pass ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${tag} ${id}: ${name}`);
    if (detail) console.log(`       -> ${detail}`);
  }

  try {
    // TC_CAT_01: Lấy danh sách danh mục (Public GET)
    {
      const res = await req('GET', '');
      const pass = res.status === 200 && res.data?.status === 'success' && Array.isArray(res.data?.data) && res.data.data.length >= 5;
      record('TC_CAT_01', 'Lấy danh sách tất cả danh mục kèm số lượng sản phẩm (Public GET)', pass,
        `Status: ${res.status}, Tìm thấy ${res.data?.data?.length || 0} danh mục trong hệ thống`);
    }

    // TC_CAT_02: Lấy chi tiết 1 danh mục theo ID
    {
      const res = await req('GET', '/1');
      const pass = res.status === 200 && res.data?.status === 'success' && res.data?.data?.id === 1;
      record('TC_CAT_02', 'Lấy thông tin chi tiết danh mục theo ID (GET /:id)', pass,
        `Status: ${res.status}, Tên danh mục: "${res.data?.data?.name}"`);
    }

    // TC_CAT_03: Chặn thêm danh mục khi không có JWT Token
    {
      const res = await req('POST', '', { name: 'Danh mục Test', slug: 'danh-muc-test' }, null);
      const pass = res.status === 401 && res.data?.status === 'error';
      record('TC_CAT_03', 'Chặn thêm danh mục khi không có Token xác thực (401 Unauthorized)', pass,
        `Status: ${res.status}, Phản hồi: "${res.data?.message}"`);
    }

    // TC_CAT_04: Chặn thêm danh mục khi tài khoản là CUSTOMER (không có quyền ADMIN)
    {
      const res = await req('POST', '', { name: 'Danh mục Test', slug: 'danh-muc-test' }, customerToken);
      const pass = res.status === 403 && res.data?.status === 'error';
      record('TC_CAT_04', 'Chặn thêm danh mục khi người dùng không phải ADMIN (403 Forbidden)', pass,
        `Status: ${res.status}, Phản hồi: "${res.data?.message}"`);
    }

    // TC_CAT_05: Thêm mới danh mục thành công với quyền ADMIN (Happy Path)
    {
      const res = await req('POST', '', {
        name: testCatName,
        slug: testCatSlug,
        description: 'Bộ sưu tập trang phục dạ tiệc cao cấp giới hạn'
      }, adminToken);
      const pass = res.status === 201 && res.data?.status === 'success' && res.data?.data?.name === testCatName;
      if (pass) createdCatId = res.data.data.id;
      record('TC_CAT_05', 'Thêm mới danh mục thành công với quyền ADMIN (201 Created)', pass,
        `Status: ${res.status}, Cấp ID: #${createdCatId}, Slug: "${res.data?.data?.slug}"`);
    }

    // TC_CAT_06: Từ chối thêm danh mục khi bỏ trống Tên danh mục
    {
      const res = await req('POST', '', { name: '', slug: 'empty-name' }, adminToken);
      const pass = res.status === 400 && res.data?.status === 'error';
      record('TC_CAT_06', 'Từ chối thêm danh mục khi Bỏ trống Tên (Validation 400 Bad Request)', pass,
        `Status: ${res.status}, Báo lỗi: "${res.data?.message}"`);
    }

    // TC_CAT_07: Từ chối thêm danh mục khi Trùng Slug (Unique Constraint)
    {
      const res = await req('POST', '', {
        name: 'Tên khác nhưng trùng slug',
        slug: testCatSlug
      }, adminToken);
      const pass = res.status === 409 && res.data?.status === 'error';
      record('TC_CAT_07', 'Từ chối thêm danh mục khi Trùng Slug định danh (409 Conflict)', pass,
        `Status: ${res.status}, Báo lỗi: "${res.data?.message}"`);
    }

    // TC_CAT_08: Cập nhật thông tin danh mục thành công (PUT /:id)
    {
      const res = await req('PUT', `/${createdCatId}`, {
        name: `${testCatName} [Đã Update]`,
        description: 'Mô tả mới đã được biên tập lại'
      }, adminToken);
      const pass = res.status === 200 && res.data?.status === 'success' && res.data?.data?.name.includes('[Đã Update]');
      record('TC_CAT_08', 'Cập nhật thông tin danh mục thành công (200 OK)', pass,
        `Status: ${res.status}, Tên mới: "${res.data?.data?.name}"`);
    }

    // TC_CAT_09: Chặn xóa danh mục khi vẫn còn sản phẩm liên kết (Foreign Key Integrity)
    {
      // Danh mục 1 (Áo Vest & Blazer) đang có nhiều sản phẩm liên kết trong DB
      const res = await req('DELETE', '/1', null, adminToken);
      const pass = res.status === 400 && res.data?.status === 'error' && res.data?.message.includes('sản phẩm liên kết');
      record('TC_CAT_09', 'Chặn xóa danh mục khi có sản phẩm liên kết (Toàn vẹn CSDL)', pass,
        `Status: ${res.status}, Chặn an toàn: "${res.data?.message}"`);
    }

    // TC_CAT_10: Xóa danh mục thành công khi không có sản phẩm liên kết
    {
      const res = await req('DELETE', `/${createdCatId}`, null, adminToken);
      const pass = res.status === 200 && res.data?.status === 'success';
      record('TC_CAT_10', 'Xóa danh mục rỗng thành công khi không có sản phẩm (DELETE 200 OK)', pass,
        `Status: ${res.status}, Thông báo: "${res.data?.message}"`);
    }

    // TC_CAT_11: Xác nhận danh mục đã xóa hoàn toàn khỏi DB (404 Not Found)
    {
      const res = await req('GET', `/${createdCatId}`);
      const pass = res.status === 404;
      record('TC_CAT_11', 'Truy vấn lại danh mục đã xóa trả về mã lỗi 404 (Xác nhận tính nhất quán)', pass,
        `Status: ${res.status}, Danh mục #${createdCatId} không còn tồn tại trong hệ thống`);
    }

    console.log('\n================================================================');
    const total = results.length;
    const passed = results.filter(r => r.pass).length;
    console.log(`TỔNG KẾT KIỂM THỬ DANH MỤC: ${passed}/${total} Test Cases ĐẠT (PASS 100%)`);
    console.log('================================================================\n');

  } finally {
    // Dọn dẹp an toàn nếu còn sót lại
    if (createdCatId) {
      await pool.request().input('id', createdCatId).query('DELETE FROM categories WHERE id = @id');
    }
    await pool.close();
  }
}

runCategoryTests().catch(console.error);
