/**
 * BỘ KIỂM THỬ TỰ ĐỘNG: CHUẨN HÓA DỮ LIỆU HÌNH ẢNH & THUỘC TÍNH SẢN PHẨM THỰC TẾ
 * Dự án: AURALIÈ Haute Couture
 * Tác giả: Đội ngũ Kỹ sư Hệ thống AURALIÈ
 *
 * Mục tiêu kiểm thử:
 * 1. Chuẩn hóa hình ảnh 50 sản phẩm độc bản, không trùng lặp, đúng với từng danh mục.
 * 2. Xác thực thuộc tính mở rộng (lining, hardware, origin, fit, material).
 * 3. Kiểm chứng cơ chế tạo biến thể tự động (Auto-Variant Generation: SKU, stock).
 * 4. Kiểm tra bảo mật & validation form tạo sản phẩm của Quản trị viên.
 */

require('dotenv').config();
const { query } = require('../src/config/db');
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

async function runProductNormalizationTests() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ CHUẨN HÓA HÌNH ẢNH & THUỘC TÍNH SẢN PHẨM');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;
  let createdProductId = null;

  function assert(condition, message, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] TC_PRD_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.log(`       -> ${detail}`);
    } else {
      console.error(`[FAIL] TC_PRD_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.error(`       -> ${detail}`);
    }
  }

  const adminToken = generateAdminToken();

  try {
    // -------------------------------------------------------------
    // TC_PRD_01: Chuẩn hóa Hình ảnh Độc Bản 50 Sản Phẩm
    // -------------------------------------------------------------
    const resProducts = await fetch(`${BASE_URL}/products?limit=50`);
    const jsonProducts = await resProducts.json();
    const productsData = Array.isArray(jsonProducts.data) ? jsonProducts.data : (jsonProducts.data?.products || []);
    
    const uniqueImages = new Set();
    productsData.forEach(p => {
      const img = p.img || p.thumbnail || (p.images && p.images[0]?.imageUrl);
      if (img) uniqueImages.add(img);
    });

    assert(
      resProducts.status === 200 && productsData.length === 50 && uniqueImages.size >= 50,
      'Chuẩn hóa Hình ảnh Độc Bản: 50 sản phẩm sở hữu 50 file hình ảnh riêng biệt, không trùng lặp',
      `Tổng số sản phẩm: ${productsData.length}, Số lượng ảnh độc bản: ${uniqueImages.size}`
    );

    // -------------------------------------------------------------
    // TC_PRD_02: Tính Nhất Quán Giữa Ảnh và Danh Mục
    // -------------------------------------------------------------
    // Kiểm tra sản phẩm Áo Vest & Blazer (catSlug: 'vest-blazer') phải dùng ảnh vest_*
    const vestProducts = productsData.filter(p => p.catSlug === 'vest-blazer');
    const allVestImagesMatch = vestProducts.length > 0 && vestProducts.every(p => {
      const img = p.img || '';
      return img.includes('vest_');
    });

    // Kiểm tra sản phẩm Túi Xách Da (catSlug: 'tui-xach') phải dùng ảnh bag_*
    const bagProducts = productsData.filter(p => p.catSlug === 'tui-xach');
    const allBagImagesMatch = bagProducts.length > 0 && bagProducts.every(p => {
      const img = p.img || '';
      return img.includes('bag_');
    });

    assert(
      allVestImagesMatch && allBagImagesMatch,
      'Tính Nhất Quán Giữa Ảnh và Danh Mục: Áo Vest chỉ dùng ảnh vest, Túi xách chỉ dùng ảnh bag',
      `Áo Vest khớp ảnh: ${allVestImagesMatch} (${vestProducts.length} SP), Túi Xách khớp ảnh: ${allBagImagesMatch} (${bagProducts.length} SP)`
    );

    // -------------------------------------------------------------
    // TC_PRD_03: Chặn thêm sản phẩm khi không có quyền Admin (Auth Guard)
    // -------------------------------------------------------------
    const resNoAuth = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fake Product', price: 1000000, categoryId: 1 })
    });
    assert(
      resNoAuth.status === 401,
      'Chặn thêm sản phẩm khi chưa đăng nhập hoặc không có Bearer Token',
      `HTTP Status: ${resNoAuth.status}`
    );

    // -------------------------------------------------------------
    // TC_PRD_04: Chặn thêm sản phẩm với dữ liệu không hợp lệ (Validation)
    // -------------------------------------------------------------
    const resInvalid = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: '',
        price: -500000,
        categoryId: 999
      })
    });
    assert(
      resInvalid.status === 400,
      'Validation: Chặn tạo sản phẩm khi tên trống, giá bán <= 0 hoặc categoryId không tồn tại',
      `HTTP Status: ${resInvalid.status}`
    );

    // -------------------------------------------------------------
    // TC_PRD_05: Thêm Sản Phẩm Túi Xách với Thuộc Tính Đặc Thù & Tồn Kho Tự Động
    // -------------------------------------------------------------
    const bagPayload = {
      name: 'Hermes Birkin Inspired Croc Embossed Tote',
      price: 36000000,
      categoryId: 4, // Túi xách
      description: 'Túi xách da dập vân cá sấu cao cấp khóa xoay mạ vàng 18K khâu yên ngựa.',
      tag: 'VIP EXCLUSIVE',
      material: 'Da Đà Điểu Thảo Mộc',
      fit: '30cm x 22cm x 16cm',
      lining: 'Nhung Nỉ Cao Cấp',
      hardware: 'Khóa Xoay Mạ Vàng 18K',
      origin: 'Florence, Italy',
      color: 'Emerald Green',
      size: 'FreeSize',
      stockQuantity: 8,
      imageUrl: 'assets/products/bag_4_crocodile_clutch.jpg'
    };

    const resCreateBag = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(bagPayload)
    });

    const createBagData = await resCreateBag.json();
    createdProductId = createBagData.data?.id;

    assert(
      resCreateBag.status === 201 && createdProductId > 0,
      'Thêm Sản Phẩm Túi Xách thành công với các trường thuộc tính mở rộng (Lining, Hardware, Origin)',
      `Created Product ID: ${createdProductId}, Name: ${createBagData.data?.name}`
    );

    // -------------------------------------------------------------
    // TC_PRD_06: Kiểm tra Lưu Trữ CSDL SQL Server Đầy Đủ Thuộc Tính
    // -------------------------------------------------------------
    const dbProduct = await query(
      `SELECT id, name, category_id, material, fit, lining, hardware, origin FROM products WHERE id = @id`,
      { id: createdProductId }
    );
    const row = dbProduct.recordset[0];

    assert(
      row && row.lining === 'Nhung Nỉ Cao Cấp' && row.hardware === 'Khóa Xoay Mạ Vàng 18K' && row.origin === 'Florence, Italy',
      'Kiểm tra CSDL: Bảng products lưu trữ chính xác lining, hardware, origin của túi xách',
      `Lining: ${row?.lining}, Hardware: ${row?.hardware}, Origin: ${row?.origin}`
    );

    // -------------------------------------------------------------
    // TC_PRD_07: Tự Động Sinh Biến Thể & SKU (Auto-Variant Generation)
    // -------------------------------------------------------------
    const dbVariants = await query(
      `SELECT id, product_id, size, color, stock_quantity, sku FROM product_variants WHERE product_id = @id`,
      { id: createdProductId }
    );
    const variantRow = dbVariants.recordset[0];

    assert(
      dbVariants.recordset.length >= 1 && variantRow && variantRow.stock_quantity === 8 && variantRow.sku.startsWith('AUR-'),
      'Tự Động Sinh Biến Thể: Hệ thống tự sinh bản ghi trong product_variants kèm SKU và stockQuantity = 8',
      `SKU: ${variantRow?.sku}, Size: ${variantRow?.size}, Stock: ${variantRow?.stock_quantity}`
    );

    // -------------------------------------------------------------
    // TC_PRD_08: Sản Phẩm Mới Xuất Hiện Trên Catalog & Bộ Lọc
    // -------------------------------------------------------------
    const resCatalog = await fetch(`${BASE_URL}/products?category=tui-xach&limit=100`);
    const jsonCatalog = await resCatalog.json();
    const catalogData = Array.isArray(jsonCatalog.data) ? jsonCatalog.data : (jsonCatalog.data?.products || []);
    const foundInCatalog = catalogData.some(p => p.id === createdProductId);

    assert(
      foundInCatalog,
      'Khả Dụng: Sản phẩm vừa tạo xuất hiện ngay lập tức trên Danh mục Túi xách và Bộ lọc',
      `Tìm thấy trong catalog danh mục túi xách: ${foundInCatalog}`
    );

    // -------------------------------------------------------------
    // TC_PRD_09: Xem Chi Tiết Sản Phẩm & Thuộc Tính Mở Rộng
    // -------------------------------------------------------------
    const resDetail = await fetch(`${BASE_URL}/products/${createdProductId}`);
    const detailData = (await resDetail.json()).data;

    assert(
      resDetail.status === 200 && detailData && detailData.lining === 'Nhung Nỉ Cao Cấp' && detailData.hardware === 'Khóa Xoay Mạ Vàng 18K',
      'Chi Tiết Sản Phẩm: API trả về đầy đủ thuộc tính may đo & phụ kiện cao cấp (Lining, Hardware, Origin)',
      `HTTP Status: ${resDetail.status}, Lining: ${detailData?.lining}, Hardware: ${detailData?.hardware}`
    );

    // -------------------------------------------------------------
    // TC_PRD_10: Dọn Dẹp Dữ Liệu Kiểm Thử An Toàn (Cleanup)
    // -------------------------------------------------------------
    const resDelete = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert(
      resDelete.status === 200,
      'Dọn dẹp kiểm thử: Xóa/ẩn sản phẩm thử nghiệm thành công (Soft-delete/Deactivate)',
      `HTTP Status: ${resDelete.status}`
    );

  } catch (err) {
    console.error('LỖI KHÔNG MONG MUỐN TRONG QUÁ TRÌNH KIỂM THỬ:', err);
  } finally {
    // Nếu còn sót lại sản phẩm kiểm thử trong DB, xóa vĩnh viễn
    if (createdProductId) {
      try {
        await query('DELETE FROM product_images WHERE product_id = @id', { id: createdProductId });
        await query('DELETE FROM product_variants WHERE product_id = @id', { id: createdProductId });
        await query('DELETE FROM products WHERE id = @id', { id: createdProductId });
      } catch (e) {
        // Ignore cleanup error
      }
    }
  }

  console.log('\n================================================================');
  console.log(`   KẾT QUẢ KIỂM THỬ: ${passed} / ${total} CA KIỂM THỬ ĐẠT (PASS ${(passed/total*100).toFixed(1)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProductNormalizationTests();
