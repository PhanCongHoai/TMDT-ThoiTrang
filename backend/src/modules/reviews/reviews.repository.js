const { query } = require('../../config/db');

class ReviewRepository {
  static async findByProductId(productId) {
    const result = await query(`
      SELECT * FROM product_reviews 
      WHERE product_id = @id 
      ORDER BY created_at DESC
    `, { id: productId });

    const total = result.recordset.length;
    let avg = 5.0;
    if (total > 0) {
      const sum = result.recordset.reduce((acc, r) => acc + r.rating, 0);
      avg = (sum / total).toFixed(1);
    }

    return {
      summary: {
        averageRating: Number(avg),
        totalReviews: total,
        recommendationPercentage: 98
      },
      reviews: result.recordset
    };
  }

  static async create({ productId, userName, userEmail, rating, comment, variantInfo }) {
    await query(`
      INSERT INTO product_reviews (product_id, user_name, user_email, rating, comment, variant_info, is_verified_buyer)
      VALUES (@productId, @userName, @userEmail, @rating, @comment, @variantInfo, 1)
    `, {
      productId: Number(productId) || 1,
      userName,
      userEmail: userEmail || '',
      rating: Number(rating) || 5,
      comment,
      variantInfo: variantInfo || 'Khách hàng AURALIÈ VIP'
    });
    return true;
  }

  static async checkPurchaseEligibility(productId, userEmail, userPhone) {
    if (!userEmail && !userPhone) return false;
    try {
      const result = await query(`
        SELECT COUNT(*) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'COMPLETED'
          AND oi.product_id = @productId
          AND (
            (@email <> '' AND LOWER(o.customer_email) = LOWER(@email))
            OR (@phone <> '' AND o.customer_phone = @phone)
          )
      `, {
        productId: Number(productId) || 0,
        email: (userEmail || '').trim(),
        phone: (userPhone || '').trim()
      });
      return (result.recordset[0]?.total || 0) > 0;
    } catch (e) {
      console.warn('Purchase eligibility check fallback:', e.message);
      return false;
    }
  }

  static async like(id) {
    try {
      await query(`UPDATE product_reviews SET helpful_count = ISNULL(helpful_count, 0) + 1 WHERE id = @id`, { id });
      return true;
    } catch (e) {
      return true;
    }
  }

  static async findAllForAdmin() {
    const result = await query(`
      SELECT r.*, p.name AS product_name 
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    return result.recordset;
  }

  static async approve(id) {
    await query(`UPDATE product_reviews SET is_verified_buyer = 1 WHERE id = @id`, { id });
    return true;
  }

  static async delete(id) {
    await query(`DELETE FROM product_reviews WHERE id = @id`, { id });
    return true;
  }
}

module.exports = ReviewRepository;

