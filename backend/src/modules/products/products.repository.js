const { query } = require('../../config/db');

class ProductRepository {
  static async findAll({ category, search, tag }) {
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
        c.name AS category, 
        c.slug AS catSlug,
        COALESCE(img.image_url, 'assets/card_1.jpg') AS img,
        COALESCE(AVG(CAST(r.rating AS FLOAT)), 5.0) AS rating,
        COUNT(r.id) AS reviewCount
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, image_url, ROW_NUMBER() OVER(PARTITION BY product_id ORDER BY is_thumbnail DESC, id ASC) AS rn
        FROM product_images
      ) img ON p.id = img.product_id AND img.rn = 1
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE p.is_active = 1
    `;

    const params = {};
    if (category && category !== 'all') {
      sqlQuery += ` AND c.slug = @category`;
      params.category = category;
    }
    if (search) {
      sqlQuery += ` AND (p.name LIKE @search OR p.description LIKE @search)`;
      params.search = `%${search}%`;
    }
    if (tag) {
      sqlQuery += ` AND p.tag = @tag`;
      params.tag = tag;
    }

    sqlQuery += `
      GROUP BY 
        p.id, p.name, p.slug, p.description, p.base_price, p.tag, 
        p.material, p.fit, p.lining, p.hardware, p.origin, 
        c.name, c.slug, img.image_url
      ORDER BY p.id ASC
    `;

    const result = await query(sqlQuery, params);
    return result.recordset;
  }

  static async findById(id) {
    const prodResult = await query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = @id AND p.is_active = 1
    `, { id });

    if (!prodResult.recordset.length) return null;

    const product = prodResult.recordset[0];
    const varResult = await query(`SELECT * FROM product_variants WHERE product_id = @id`, { id });
    product.variants = varResult.recordset;

    const imgResult = await query(`SELECT * FROM product_images WHERE product_id = @id`, { id });
    product.images = imgResult.recordset;

    return product;
  }

  static async create({ name, categoryId, basePrice, description, tag, material, fit }) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    const insertResult = await query(`
      INSERT INTO products (name, slug, description, base_price, category_id, tag, material, fit, is_active)
      OUTPUT INSERTED.id
      VALUES (@name, @slug, @description, @basePrice, @categoryId, @tag, @material, @fit, 1)
    `, {
      name,
      slug,
      description: description || '',
      basePrice: Number(basePrice),
      categoryId: Number(categoryId) || 1,
      tag: tag || 'NEW ARRIVAL',
      material: material || 'Len & Lụa Cao Cấp',
      fit: fit || 'European Tailored'
    });

    return { id: insertResult.recordset[0].id, name, slug };
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
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.id ASC
    `;
    const result = await query(sqlQuery);
    return result.recordset;
  }
}

module.exports = ProductRepository;

