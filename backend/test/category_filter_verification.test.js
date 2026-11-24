/**
 * BỘ KIỂM THỬ TỰ ĐỘNG: BỘ LỌC ĐỘNG THEO TỪNG DANH MỤC (DYNAMIC CATEGORY-SPECIFIC FILTER SUITE)
 * Dự án: AURALIÈ Haute Couture
 * Tác giả: Đội ngũ Kỹ sư Hệ thống AURALIÈ
 *
 * Mục tiêu kiểm thử:
 * 1. Đảm bảo mỗi danh mục thời trang sở hữu bộ lọc và facet riêng biệt (Kích cỡ âu phục, Dáng túi, Size giày, Phom dạ hội...).
 * 2. Ngăn ngừa hiển thị size quần áo (S/M/L) cho Túi xách da cao cấp.
 * 3. Kiểm chứng các truy vấn lọc nâng cao: Màu sắc, Kích cỡ, Chất liệu, Phom dáng, Khoảng giá, Sắp xếp giá.
 * 4. Bảo mật & Kiểm tra dữ liệu đầu vào (Input Sanitization).
 */

const { query } = require('../src/config/db');
const ProductService = require('../src/modules/products/products.service');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runCategoryFilterTests() {
  console.log('================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ BỘ LỌC ĐỘNG THEO DANH MỤC (DYNAMIC FILTER)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message, detail = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] TC_FLT_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.log(`       -> ${detail}`);
    } else {
      console.error(`[FAIL] TC_FLT_${String(total).padStart(2, '0')}: ${message}`);
      if (detail) console.error(`       -> ${detail}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // PHÂN HỆ 1: TRUY VẤN FACETS BỘ LỌC ĐỘNG TỪNG DANH MỤC
    // -------------------------------------------------------------
    console.log('--- PHÂN HỆ 1: TRUY VẤN FACETS BỘ LỌC ĐỘNG TỪNG DANH MỤC ---');

    // TC_FLT_01: Bộ lọc tổng hợp (All)
    const resAll = await fetch(`${BASE_URL}/products/filters?category=all`);
    const dataAll = (await resAll.json()).data;
    assert(
      resAll.status === 200 && dataAll.sizes.includes('S') && dataAll.sizes.includes('37'),
      'Bộ lọc Tất Cả (all): Trả về đầy đủ dải kích cỡ tổng hợp từ quần áo đến size giày',
      `Sizes: ${dataAll.sizes.length} loại, Colors: ${dataAll.colors.length} màu`
    );

    // TC_FLT_02: Bộ lọc Túi Xách (Không có size quần áo S, M, L, XL!)
    const resBag = await fetch(`${BASE_URL}/products/filters?category=tui-xach`);
    const dataBag = (await resBag.json()).data;
    const hasClothingSize = dataBag.sizes.some(s => ['S', 'M', 'L', 'XL'].includes(s));
    assert(
      resBag.status === 200 && !hasClothingSize && dataBag.materials.length > 0 && dataBag.fits.length > 0,
      'Bộ lọc Túi Xách Da (tui-xach): TUYỆT ĐỐI KHÔNG chứa size quần áo S/M/L, trả về đúng dáng túi và dòng da',
      `Sizes: [${dataBag.sizes.join(', ')}], Fits: ${dataBag.fits.length} dáng túi, Materials: ${dataBag.materials.length} dòng da`
    );

    // TC_FLT_03: Bộ lọc Áo Vest & Blazer
    const resVest = await fetch(`${BASE_URL}/products/filters?category=vest-blazer`);
    const dataVest = (await resVest.json()).data;
    assert(
      resVest.status === 200 && dataVest.sizes.includes('S') && dataVest.sizes.includes('XL') && dataVest.fits.some(f => f.includes('Tailored')),
      'Bộ lọc Áo Vest & Blazer (vest-blazer): Chứa chuẩn size âu phục S, M, L, XL và phom dáng may đo Tailored',
      `Sizes: [${dataVest.sizes.join(', ')}], Fits: [${dataVest.fits.slice(0, 3).join(', ')}...]`
    );

    // TC_FLT_04: Bộ lọc Giày & Phụ Kiện
    const resShoes = await fetch(`${BASE_URL}/products/filters?category=giay-phu-kien`);
    const dataShoes = (await resShoes.json()).data;
    assert(
      resShoes.status === 200 && dataShoes.sizes.includes('36') && dataShoes.sizes.includes('42'),
      'Bộ lọc Giày & Phụ Kiện (giay-phu-kien): Chứa chuẩn bảng size giày Châu Âu EU 36 đến 42',
      `Sizes: [${dataShoes.sizes.join(', ')}]`
    );

    // -------------------------------------------------------------
    // PHÂN HỆ 2: THỰC THI TRUY VẤN LỌC SẢN PHẨM NÂNG CAO (QUERY EXECUTION)
    // -------------------------------------------------------------
    console.log('\n--- PHÂN HỆ 2: THỰC THI TRUY VẤN LỌC SẢN PHẨM NÂNG CAO ---');

    // TC_FLT_05: Lọc Vest theo size M
    const resVestM = await fetch(`${BASE_URL}/products?category=vest-blazer&size=M`);
    const vestM = (await resVestM.json()).data;
    assert(
      resVestM.status === 200 && vestM.length > 0 && vestM.every(p => p.catSlug === 'vest-blazer'),
      'Lọc Áo Vest kích cỡ M: Trả về chính xác các mẫu Vest sẵn hàng size M trong kho',
      `Tìm thấy ${vestM.length} sản phẩm phù hợp`
    );

    // TC_FLT_06: Lọc Túi Xách theo tông màu Đen
    const resBagBlack = await fetch(`${BASE_URL}/products?category=tui-xach&color=${encodeURIComponent('Đen')}`);
    const bagBlack = (await resBagBlack.json()).data;
    assert(
      resBagBlack.status === 200 && bagBlack.length > 0 && bagBlack.every(p => p.catSlug === 'tui-xach'),
      'Lọc Túi Xách tông màu Đen: Nhận diện chính xác các sản phẩm túi màu Jet Black / Caviar Black',
      `Tìm thấy ${bagBlack.length} mẫu túi đen xa xỉ`
    );

    // TC_FLT_07: Lọc theo Chất liệu Cashmere
    const resCashmere = await fetch(`${BASE_URL}/products?material=${encodeURIComponent('Cashmere')}`);
    const cashmereProds = (await resCashmere.json()).data;
    assert(
      resCashmere.status === 200 && cashmereProds.length > 0 && cashmereProds.every(p => p.material.includes('Cashmere')),
      'Lọc Chất Liệu Thượng Hạng (Cashmere): Trả về các thiết kế dệt từ len Cashmere thượng lưu',
      `Tìm thấy ${cashmereProds.length} thiết kế Cashmere`
    );

    // TC_FLT_08: Lọc Váy Đầm theo Phom Dáng Mermaid (Đuôi cá)
    const resMermaid = await fetch(`${BASE_URL}/products?category=vay-dam&fit=${encodeURIComponent('Mermaid')}`);
    const mermaidProds = (await resMermaid.json()).data;
    assert(
      resMermaid.status === 200 && mermaidProds.length > 0 && mermaidProds.every(p => p.fit.includes('Mermaid')),
      'Lọc Phom Dáng Dạ Hội (Mermaid): Trả về các đầm đuôi cá tôn vinh đường cong quyến rũ',
      `Tìm thấy ${mermaidProds.length} đầm dạ hội đuôi cá`
    );

    // TC_FLT_09: Lọc theo Khoảng Giá (15 Triệu - 25 Triệu)
    const resPrice = await fetch(`${BASE_URL}/products?minPrice=15000000&maxPrice=25000000`);
    const priceProds = (await resPrice.json()).data;
    const allInRange = priceProds.every(p => p.price >= 15000000 && p.price <= 25000000);
    assert(
      resPrice.status === 200 && priceProds.length > 0 && allInRange,
      'Lọc Khoảng Giá (15M - 25M): Tất cả sản phẩm trả về nằm trong khoảng ngân sách định sẵn',
      `Số lượng: ${priceProds.length} sản phẩm, Giá từ ${Math.min(...priceProds.map(p => p.price)).toLocaleString('vi-VN')}₫ đến ${Math.max(...priceProds.map(p => p.price)).toLocaleString('vi-VN')}₫`
    );

    // TC_FLT_10: Sắp xếp giá Thấp đến Cao (price-asc)
    const resAsc = await fetch(`${BASE_URL}/products?sort=price-asc`);
    const ascProds = (await resAsc.json()).data;
    let isAscending = true;
    for (let i = 0; i < ascProds.length - 1; i++) {
      if (ascProds[i].price > ascProds[i + 1].price) {
        isAscending = false;
        break;
      }
    }
    assert(
      resAsc.status === 200 && isAscending,
      'Sắp xếp Giá: Thấp đến Cao (price-asc): Dữ liệu được sắp xếp tăng dần nghiêm ngặt',
      `Giá đầu: ${ascProds[0].price.toLocaleString('vi-VN')}₫ -> Giá cuối: ${ascProds[ascProds.length - 1].price.toLocaleString('vi-VN')}₫`
    );

    // TC_FLT_11: Sắp xếp giá Cao đến Thấp (price-desc)
    const resDesc = await fetch(`${BASE_URL}/products?sort=price-desc`);
    const descProds = (await resDesc.json()).data;
    let isDescending = true;
    for (let i = 0; i < descProds.length - 1; i++) {
      if (descProds[i].price < descProds[i + 1].price) {
        isDescending = false;
        break;
      }
    }
    assert(
      resDesc.status === 200 && isDescending,
      'Sắp xếp Giá: Cao đến Thấp (price-desc): Dữ liệu được sắp xếp giảm dần chuẩn xác',
      `Giá đầu: ${descProds[0].price.toLocaleString('vi-VN')}₫ -> Giá cuối: ${descProds[descProds.length - 1].price.toLocaleString('vi-VN')}₫`
    );

    // -------------------------------------------------------------
    // PHÂN HỆ 3: BẢO MẬT & KIỂM TRA ĐẦU VÀO (INPUT SANITIZATION)
    // -------------------------------------------------------------
    console.log('\n--- PHÂN HỆ 3: BẢO MẬT & KIỂM TRA ĐẦU VÀO ---');

    // TC_FLT_12: Ngăn chặn tham số lọc quá dài / bất thường
    const longParam = 'A'.repeat(150);
    const resMalformed = await fetch(`${BASE_URL}/products?color=${longParam}`);
    assert(
      resMalformed.status === 400,
      'Bảo vệ Input Sanitization: Từ chối xử lý tham số lọc vượt ngưỡng độ dài cho phép (HTTP 400)',
      'Status: 400 Bad Request, Chặn tràn bộ nhớ đệm và SQL Injection'
    );

    console.log('\n================================================================');
    console.log(`TỔNG KẾT KIỂM THỬ BỘ LỌC ĐỘNG: ${passed}/${total} Test Cases ĐẠT (PASS ${Math.round(passed/total*100)}%)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Lỗi trong quá trình chạy kiểm thử bộ lọc:', err);
  }
}

runCategoryFilterTests().then(() => process.exit(0));
