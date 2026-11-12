const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { verifyToken, optionalAuth } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/response');

// GET Wishlist
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT w.id AS wishlist_id, w.created_at AS added_at,
             p.id, p.name, p.slug, p.base_price AS price, p.tag,
             c.name AS category,
             COALESCE(img.image_url, 'assets/card_1.jpg') AS img,
             COALESCE(AVG(CAST(r.rating AS FLOAT)), 5.0) AS rating,
             COUNT(r.id) AS review_count
      FROM wishlists w
      JOIN products p ON w.product_id = p.id AND p.is_active = 1
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, image_url, ROW_NUMBER() OVER(PARTITION BY product_id ORDER BY is_thumbnail DESC, id ASC) AS rn
        FROM product_images
      ) img ON p.id = img.product_id AND img.rn = 1
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE w.user_id = @userId
      GROUP BY w.id, w.created_at, p.id, p.name, p.slug, p.base_price, p.tag, c.name, img.image_url
      ORDER BY w.created_at DESC
    `, { userId });

    return ApiResponse.success(res, result.recordset, 'Lấy danh sách yêu thích thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

// POST Add to Wishlist
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) {
      return ApiResponse.error(res, 'productId là bắt buộc', 400);
    }

    const prodCheck = await query('SELECT id, name FROM products WHERE id = @productId AND is_active = 1', { productId: Number(productId) });
    if (!prodCheck.recordset.length) {
      return ApiResponse.error(res, 'Sản phẩm không tồn tại', 404);
    }

    const existing = await query('SELECT id FROM wishlists WHERE user_id = @userId AND product_id = @productId', {
      userId, productId: Number(productId)
    });

    if (existing.recordset.length > 0) {
      return ApiResponse.success(res, null, 'Sản phẩm đã có trong danh sách yêu thích.');
    }

    await query('INSERT INTO wishlists (user_id, product_id) VALUES (@userId, @productId)', {
      userId, productId: Number(productId)
    });

    return ApiResponse.success(res, null, `Đã thêm "${prodCheck.recordset[0].name}" vào danh sách yêu thích!`, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE Remove from Wishlist
router.delete('/:productId', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await query('DELETE FROM wishlists WHERE user_id = @userId AND product_id = @productId', {
      userId, productId: Number(productId)
    });

    return ApiResponse.success(res, null, 'Đã xóa sản phẩm khỏi danh sách yêu thích.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

