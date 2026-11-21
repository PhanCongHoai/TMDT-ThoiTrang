const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../config/db');

async function completeAllProducts() {
  const missingData = [
    // Category 1
    {
      id: 2,
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'S', color: 'Đen Tuyền (Jet Black)', stock: 8, sku: 'AUR-BLZBOOT-S-BK', price: 16800000 },
        { size: 'M', color: 'Đen Tuyền (Jet Black)', stock: 12, sku: 'AUR-BLZBOOT-M-BK', price: 16800000 },
        { size: 'L', color: 'Đen Tuyền (Jet Black)', stock: 6, sku: 'AUR-BLZBOOT-L-BK', price: 16800000 }
      ]
    },
    {
      id: 3,
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'S', color: 'Nhung Đen (Black Velvet)', stock: 5, sku: 'AUR-RYTUX-S-BK', price: 19500000 },
        { size: 'M', color: 'Nhung Đen (Black Velvet)', stock: 8, sku: 'AUR-RYTUX-M-BK', price: 19500000 },
        { size: 'L', color: 'Nhung Đen (Black Velvet)', stock: 4, sku: 'AUR-RYTUX-L-BK', price: 19500000 }
      ]
    },
    {
      id: 4,
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'S', color: 'Xanh Navy (Italian Navy)', stock: 7, sku: 'AUR-ITBLZ-S-NV', price: 14800000 },
        { size: 'M', color: 'Xanh Navy (Italian Navy)', stock: 11, sku: 'AUR-ITBLZ-M-NV', price: 14800000 },
        { size: 'L', color: 'Xanh Navy (Italian Navy)', stock: 6, sku: 'AUR-ITBLZ-L-NV', price: 14800000 }
      ]
    },

    // Category 2
    {
      id: 6,
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'S', color: 'Ngọc Lục Bảo (Emerald Green)', stock: 6, sku: 'AUR-EMGOW-S-EM', price: 21500000 },
        { size: 'M', color: 'Ngọc Lục Bảo (Emerald Green)', stock: 9, sku: 'AUR-EMGOW-M-EM', price: 21500000 },
        { size: 'L', color: 'Ngọc Lục Bảo (Emerald Green)', stock: 5, sku: 'AUR-EMGOW-L-EM', price: 21500000 }
      ]
    },
    {
      id: 7,
      image: 'assets/card_4.jpg',
      variants: [
        { size: 'S', color: 'Xanh Đêm (Midnight Blue)', stock: 5, sku: 'AUR-MDSAT-S-MB', price: 25000000 },
        { size: 'M', color: 'Xanh Đêm (Midnight Blue)', stock: 8, sku: 'AUR-MDSAT-M-MB', price: 25000000 },
        { size: 'L', color: 'Xanh Đêm (Midnight Blue)', stock: 4, sku: 'AUR-MDSAT-L-MB', price: 25000000 }
      ]
    },
    {
      id: 8,
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'S', color: 'Hồng Phấn (Blush Pink)', stock: 8, sku: 'AUR-CHFDRS-S-BP', price: 15500000 },
        { size: 'M', color: 'Hồng Phấn (Blush Pink)', stock: 10, sku: 'AUR-CHFDRS-M-BP', price: 15500000 },
        { size: 'L', color: 'Hồng Phấn (Blush Pink)', stock: 6, sku: 'AUR-CHFDRS-L-BP', price: 15500000 }
      ]
    },

    // Category 3
    {
      id: 9,
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'FreeSize', color: 'Kem Yến Mạch (Oatmeal Cream)', stock: 12, sku: 'AUR-SWTR-FS-OT', price: 8200000 },
        { size: 'FreeSize', color: 'Xám Than (Charcoal Grey)', stock: 10, sku: 'AUR-SWTR-FS-CG', price: 8200000 }
      ]
    },
    {
      id: 10,
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'S', color: 'Xanh Navy (Midnight Navy)', stock: 7, sku: 'AUR-NVJKT-S-NV', price: 14200000 },
        { size: 'M', color: 'Xanh Navy (Midnight Navy)', stock: 9, sku: 'AUR-NVJKT-M-NV', price: 14200000 },
        { size: 'L', color: 'Xanh Navy (Midnight Navy)', stock: 5, sku: 'AUR-NVJKT-L-NV', price: 14200000 }
      ]
    },
    {
      id: 11,
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'M', color: 'Nâu Camel (Camel Brown)', stock: 8, sku: 'AUR-ALPTRN-M-CM', price: 22800000 },
        { size: 'L', color: 'Nâu Camel (Camel Brown)', stock: 6, sku: 'AUR-ALPTRN-L-CM', price: 22800000 }
      ]
    },
    {
      id: 12,
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'M', color: 'Xám Khói (Heather Grey)', stock: 7, sku: 'AUR-DBLWOOL-M-HG', price: 17900000 },
        { size: 'L', color: 'Xám Khói (Heather Grey)', stock: 5, sku: 'AUR-DBLWOOL-L-HG', price: 17900000 }
      ]
    },

    // Category 4
    {
      id: 14,
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'FreeSize', color: 'Nâu Cognac (Cognac Brown)', stock: 8, sku: 'AUR-OSTOTE-FS-CG', price: 32500000 },
        { size: 'FreeSize', color: 'Đen Tuyền (Jet Black)', stock: 6, sku: 'AUR-OSTOTE-FS-BK', price: 32500000 }
      ]
    },
    {
      id: 15,
      image: 'assets/card_4.jpg',
      variants: [
        { size: 'FreeSize', color: 'Đen Caviar (Caviar Black)', stock: 12, sku: 'AUR-MNFLP-FS-BK', price: 18500000 },
        { size: 'FreeSize', color: 'Trắng Ngà (Ivory White)', stock: 8, sku: 'AUR-MNFLP-FS-IV', price: 18500000 }
      ]
    },
    {
      id: 16,
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'FreeSize', color: 'Đen Bóng (Glossy Black)', stock: 9, sku: 'AUR-CRCLT-FS-BK', price: 21000000 },
        { size: 'FreeSize', color: 'Xanh Rêu (Emerald Green)', stock: 6, sku: 'AUR-CRCLT-FS-EM', price: 21000000 }
      ]
    },

    // Category 5
    {
      id: 18,
      image: 'assets/card_5.jpg',
      variants: [
        { size: '40', color: 'Đen Bóng (Jet Black)', stock: 8, sku: 'AUR-CFLOF-40-BK', price: 11200000 },
        { size: '41', color: 'Đen Bóng (Jet Black)', stock: 11, sku: 'AUR-CFLOF-41-BK', price: 11200000 },
        { size: '42', color: 'Đen Bóng (Jet Black)', stock: 7, sku: 'AUR-CFLOF-42-BK', price: 11200000 }
      ]
    },
    {
      id: 19,
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'FreeSize', color: 'Vàng 18K (18K Gold Plated)', stock: 25, sku: 'AUR-SCFRNG-FS-GD', price: 5500000 }
      ]
    },
    {
      id: 20,
      image: 'assets/card_1.jpg',
      variants: [
        { size: '36', color: 'Đỏ Đế Đen Bóng (Patent Black/Red)', stock: 6, sku: 'AUR-STLET-36-BK', price: 13500000 },
        { size: '37', color: 'Đỏ Đế Đen Bóng (Patent Black/Red)', stock: 10, sku: 'AUR-STLET-37-BK', price: 13500000 },
        { size: '38', color: 'Đỏ Đế Đen Bóng (Patent Black/Red)', stock: 8, sku: 'AUR-STLET-38-BK', price: 13500000 }
      ]
    }
  ];

  console.log('Adding missing images and variants for products 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20...');
  for (const item of missingData) {
    // Check Image
    const imgCheck = await query('SELECT id FROM product_images WHERE product_id = @id', { id: item.id });
    if (imgCheck.recordset.length === 0) {
      await query(`
        INSERT INTO product_images (product_id, image_url, is_thumbnail)
        VALUES (@id, @image, 1)
      `, { id: item.id, image: item.image });
      console.log(`[+] Added image for product ${item.id}`);
    }

    // Check Variants
    for (const v of item.variants) {
      const vCheck = await query('SELECT id FROM product_variants WHERE product_id = @id AND size = @size AND color = @color', {
        id: item.id,
        size: v.size,
        color: v.color
      });
      if (vCheck.recordset.length === 0) {
        await query(`
          INSERT INTO product_variants (product_id, size, color, stock_quantity, variant_price, sku)
          VALUES (@id, @size, @color, @stock, @price, @sku)
        `, {
          id: item.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          price: v.price,
          sku: v.sku
        });
      }
    }
    console.log(`[+] Added variants for product ${item.id}`);
  }

  console.log('\n=== HOÀN TẤT: KIỂM TRA LẠI TẤT CẢ 50 SẢN PHẨM ===');
  const verify = await query(`
    SELECT 
      c.id as category_id,
      c.name as category_name,
      c.slug,
      COUNT(p.id) as total_products,
      SUM(CASE WHEN stock.stock_qty > 0 THEN 1 ELSE 0 END) as in_stock_products
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    OUTER APPLY (
      SELECT COALESCE(SUM(pv.stock_quantity), 0) as stock_qty
      FROM product_variants pv
      WHERE pv.product_id = p.id
    ) stock
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.id
  `);
  console.table(verify.recordset);
  process.exit(0);
}

completeAllProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
