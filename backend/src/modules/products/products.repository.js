const { query, sql, poolPromise } = require('../../config/db');

class ProductRepository {
  static async findCatalogVariantOptions(category) {
    let sqlQuery = `
      SELECT DISTINCT v.size, v.color, p.material, p.fit
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND v.stock_quantity > 0
    `;
    const params = {};
    if (category && category !== 'all') {
      sqlQuery += ` AND c.slug = @category`;
      params.category = category;
    }
    sqlQuery += ` ORDER BY v.size, v.color`;
    const result = await query(sqlQuery, params);
    return result.recordset;
  }

  static async findAll({ category, search, tag, size, color, material, fit, minPrice, maxPrice, sort, includeOutOfStock = false } = {}) {
    let sqlQuery = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.base_price AS price, 
        p.tag,
        p.material,
        p.fit,
        p.lining,
        p.hardware,
        p.origin,
        COALESCE(stock.stock_quantity, 0) AS stock_quantity,
        c.name AS category, 
        c.slug AS catSlug,
        COALESCE(img.image_url, 'assets/card_1.jpg') AS img,
        COALESCE(AVG(CAST(r.rating AS FLOAT)), 5.0) AS rating,
        COUNT(r.id) AS reviewCount
      FROM products p
      OUTER APPLY (SELECT SUM(pv.stock_quantity) AS stock_quantity FROM product_variants pv WHERE pv.product_id=p.id) stock
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, image_url, ROW_NUMBER() OVER(PARTITION BY product_id ORDER BY is_thumbnail DESC, id ASC) AS rn
        FROM product_images
      ) img ON p.id = img.product_id AND img.rn = 1
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE p.is_active = 1
    `;

    const params = {};
    if (!includeOutOfStock) sqlQuery += ' AND COALESCE(stock.stock_quantity, 0) > 0';
    if (category && category !== 'all') {
      sqlQuery += ` AND c.slug = @category`;
      params.category = category;
    }
    if (search) {
      sqlQuery += ` AND (p.name LIKE @search OR p.description LIKE @search)`;
      params.search = `%${search}%`;
    }
    if (size || color) {
      sqlQuery += `
        AND EXISTS (
          SELECT 1 FROM product_variants v
          WHERE v.product_id = p.id AND v.stock_quantity > 0
          ${size ? 'AND v.size = @size' : ''}
          ${color ? 'AND (v.color = @color OR v.color LIKE @colorPattern)' : ''}
        )
      `;
      if (size) params.size = size;
      if (color) {
        params.color = color;
        params.colorPattern = `%${color}%`;
      }
    }
    if (material) {
      sqlQuery += ` AND p.material LIKE @material`;
      params.material = `%${material}%`;
    }
    if (fit) {
      sqlQuery += ` AND p.fit LIKE @fit`;
      params.fit = `%${fit}%`;
    }
    if (minPrice) {
      sqlQuery += ` AND p.base_price >= @minPrice`;
      params.minPrice = Number(minPrice);
    }
    if (maxPrice) {
      sqlQuery += ` AND p.base_price <= @maxPrice`;
      params.maxPrice = Number(maxPrice);
    }
    if (tag) {
      sqlQuery += ` AND p.tag = @tag`;
      params.tag = tag;
    }

    sqlQuery += `
      GROUP BY 
        p.id, p.name, p.slug, p.description, p.base_price, p.tag, 
        p.material, p.fit, p.lining, p.hardware, p.origin, 
        c.name, c.slug, img.image_url, stock.stock_quantity
    `;

    if (sort === 'price-asc') {
      sqlQuery += ` ORDER BY p.base_price ASC`;
    } else if (sort === 'price-desc') {
      sqlQuery += ` ORDER BY p.base_price DESC`;
    } else if (sort === 'newest') {
      sqlQuery += ` ORDER BY p.id DESC`;
    } else {
      sqlQuery += ` ORDER BY p.id ASC`;
    }

    const result = await query(sqlQuery, params);
    return result.recordset;
  }

  static async findById(id) {
    const prodResult = await query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id=p.id),0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = @id AND p.is_active = 1
        AND COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id=p.id),0) > 0
    `, { id });

    if (!prodResult.recordset.length) return null;

    const product = prodResult.recordset[0];
    const varResult = await query(`SELECT * FROM product_variants WHERE product_id = @id`, { id });
    product.variants = varResult.recordset;

    const imgResult = await query(`SELECT * FROM product_images WHERE product_id = @id`, { id });
    product.images = imgResult.recordset;

    return product;
  }

  static async create({
    name, categoryId, basePrice, description, tag, material, fit,
    lining, hardware, origin, variants, color, size, stockQuantity, imageUrl
  }) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    const transaction = new sql.Transaction(await poolPromise);
    await transaction.begin();
    try {
      const request = new sql.Request(transaction);
      const inputs = {
        name,
        slug,
        description: description || '',
        basePrice: Number(basePrice),
        categoryId: Number(categoryId) || 1,
        tag: tag || 'NEW ARRIVAL',
        material: material || '',
        fit: fit || '',
        lining: lining || 'Lụa Cupro Thượng Hạng',
        hardware: hardware || 'Khuy Sừng / Khóa Mạ Vàng 18K',
        origin: origin || 'Atelier AURALIÈ Đồng Khởi'
      };
      for (const [key, value] of Object.entries(inputs)) request.input(key, value);

      const insertResult = await request.query(`
        INSERT INTO products (name, slug, description, base_price, category_id, tag, material, fit, lining, hardware, origin, is_active)
        OUTPUT INSERTED.id
        VALUES (@name, @slug, @description, @basePrice, @categoryId, @tag, @material, @fit, @lining, @hardware, @origin, 1)
      `);
      const id = insertResult.recordset[0].id;

      if (imageUrl) {
        await new sql.Request(transaction)
          .input('id', sql.Int, id)
          .input('imageUrl', sql.NVarChar(255), imageUrl)
          .query('INSERT INTO product_images (product_id, image_url, is_thumbnail) VALUES (@id, @imageUrl, 1)');
      }

      // Khởi tạo các biến thể (Variants) và Số lượng tồn kho ban đầu
      let variantList = [];
      if (Array.isArray(variants) && variants.length > 0) {
        variantList = variants;
      } else if (size && color) {
        variantList = [{ size, color, stock: Number(stockQuantity) || 10 }];
      } else {
        // Mặc định phân loại chuẩn theo danh mục
        const numCat = Number(categoryId);
        const defaultSize = (numCat === 4) ? 'FreeSize' : ((numCat === 5) ? '38' : 'M');
        variantList = [{ size: defaultSize, color: color || 'Tiêu Chuẩn', stock: Number(stockQuantity) || 10 }];
      }

      for (let idx = 0; idx < variantList.length; idx++) {
        const v = variantList[idx];
        const vSize = v.size || 'FreeSize';
        const vColor = v.color || color || 'Tiêu Chuẩn';
        const vStock = Number(v.stock || v.stock_quantity || stockQuantity) || 10;
        const vSku = `AUR-${id}-${vSize}-${idx + 1}`.toUpperCase();

        await new sql.Request(transaction)
          .input('productId', sql.Int, id)
          .input('size', sql.NVarChar(20), vSize)
          .input('color', sql.NVarChar(100), vColor)
          .input('stock', sql.Int, vStock)
          .input('price', sql.Decimal(18, 2), Number(basePrice))
          .input('sku', sql.NVarChar(50), vSku)
          .query(`
            INSERT INTO product_variants (product_id, size, color, stock_quantity, variant_price, sku)
            VALUES (@productId, @size, @color, @stock, @price, @sku)
          `);
      }

      await transaction.commit();
      return { id, name, slug, img: imageUrl || null };
    } catch (error) {
      await transaction.rollback().catch(() => {});
      throw error;
    }
  }

  static async getInventory() {
    const result = await query(`
      WITH Stock AS (
        SELECT product_id, SUM(stock_quantity) AS remaining_quantity FROM product_variants GROUP BY product_id
      ), Allocated AS (
        SELECT pv.product_id, SUM(oi.quantity) AS allocated_quantity
        FROM order_items oi
        JOIN product_variants pv ON pv.id = oi.variant_id
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED')
        GROUP BY pv.product_id
      )
      SELECT p.id AS product_id, COALESCE(s.remaining_quantity, 0) AS remaining_quantity,
        COALESCE(a.allocated_quantity, 0) AS allocated_quantity,
        COALESCE(s.remaining_quantity, 0) + COALESCE(a.allocated_quantity, 0) AS total_quantity
      FROM products p LEFT JOIN Stock s ON s.product_id=p.id LEFT JOIN Allocated a ON a.product_id=p.id
      WHERE p.is_active=1
      ORDER BY p.id
    `);
    return result.recordset;
  }

  static async softDelete(id) {
    await query(`UPDATE products SET is_active = 0 WHERE id = @id`, { id });
    return true;
  }

  static async findAllCategories() {
    const sqlQuery = `
      SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        AND COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id=p.id),0) > 0
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.id ASC
    `;
    const result = await query(sqlQuery);
    return result.recordset;
  }
}

module.exports = ProductRepository;

