const { query } = require('../../config/db');

function generateSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class CategoryService {
  /**
   * Lấy toàn bộ danh mục kèm số lượng sản phẩm (bao gồm cả sản phẩm hết hàng hoặc đang kích hoạt)
   */
  static async getAll() {
    const res = await query(`
      SELECT c.id, c.name, c.slug, c.description,
             COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.id ASC
    `);
    return res.recordset;
  }

  /**
   * Lấy chi tiết 1 danh mục theo ID
   */
  static async getById(id) {
    const res = await query(`
      SELECT c.id, c.name, c.slug, c.description,
             COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = @id
      GROUP BY c.id, c.name, c.slug, c.description
    `, { id });
    return res.recordset[0] || null;
  }

  /**
   * Thêm mới danh mục sản phẩm (Dành riêng cho ADMIN)
   */
  static async create({ name, slug, description }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Tên danh mục không được để trống.');
      err.statusCode = 400;
      throw err;
    }
    if (name.trim().length > 100) {
      const err = new Error('Tên danh mục không được vượt quá 100 ký tự.');
      err.statusCode = 400;
      throw err;
    }

    const cleanName = name.trim();
    const finalSlug = (slug && slug.trim().length > 0) ? generateSlug(slug) : generateSlug(cleanName);

    if (!finalSlug) {
      const err = new Error('Slug danh mục không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra trùng slug
    const checkSlug = await query('SELECT id FROM categories WHERE slug = @slug', { slug: finalSlug });
    if (checkSlug.recordset.length > 0) {
      const err = new Error(`Mã định danh slug "${finalSlug}" đã tồn tại. Vui lòng chọn slug khác.`);
      err.statusCode = 409;
      throw err;
    }

    const insertRes = await query(`
      INSERT INTO categories (name, slug, description)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.slug, INSERTED.description
      VALUES (@name, @slug, @description)
    `, {
      name: cleanName,
      slug: finalSlug,
      description: (description && typeof description === 'string') ? description.trim() : ''
    });

    return insertRes.recordset[0];
  }

  /**
   * Chỉnh sửa thông tin danh mục (Dành riêng cho ADMIN)
   */
  static async update(id, { name, slug, description }) {
    const existing = await this.getById(id);
    if (!existing) {
      const err = new Error('Không tìm thấy danh mục yêu cầu.');
      err.statusCode = 404;
      throw err;
    }

    const newName = (name && typeof name === 'string' && name.trim().length > 0) ? name.trim() : existing.name;
    let newSlug = existing.slug;
    if (slug && typeof slug === 'string' && slug.trim().length > 0) {
      newSlug = generateSlug(slug);
    } else if (name && name.trim() !== existing.name) {
      newSlug = generateSlug(newName);
    }

    // Kiểm tra trùng slug với danh mục khác
    const checkSlug = await query('SELECT id FROM categories WHERE slug = @slug AND id <> @id', { slug: newSlug, id });
    if (checkSlug.recordset.length > 0) {
      const err = new Error(`Mã định danh slug "${newSlug}" đã được sử dụng bởi danh mục khác.`);
      err.statusCode = 409;
      throw err;
    }

    const newDesc = description !== undefined ? String(description).trim() : existing.description;

    const updateRes = await query(`
      UPDATE categories
      SET name = @name, slug = @slug, description = @description
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.slug, INSERTED.description
      WHERE id = @id
    `, {
      id,
      name: newName,
      slug: newSlug,
      description: newDesc
    });

    return updateRes.recordset[0];
  }

  /**
   * Xóa danh mục sản phẩm (Dành riêng cho ADMIN)
   * Kiểm tra ràng buộc toàn vẹn dữ liệu: Không cho phép xóa nếu đang có sản phẩm liên kết
   */
  static async delete(id) {
    const existing = await this.getById(id);
    if (!existing) {
      const err = new Error('Không tìm thấy danh mục cần xóa.');
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra số lượng sản phẩm liên kết
    const checkProd = await query('SELECT COUNT(id) AS total FROM products WHERE category_id = @id', { id });
    const totalLinked = checkProd.recordset[0]?.total || 0;
    if (totalLinked > 0) {
      const err = new Error(`Không thể xóa danh mục "${existing.name}" vì hiện đang có ${totalLinked} sản phẩm liên kết. Vui lòng chuyển hoặc xóa các sản phẩm này trước.`);
      err.statusCode = 400;
      throw err;
    }

    await query('DELETE FROM categories WHERE id = @id', { id });
    return { id, name: existing.name };
  }
}

module.exports = CategoryService;
