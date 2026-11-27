const { query } = require('../../config/db');
const { productBadgeJoin } = require('../products/product-badges');

class RecommendationService {
  /**
   * Hybrid Recommendation Engine (Content-based + Session-based + Popularity Fallback)
   * Phù hợp 100% với đặc thù thời trang may đo Haute Couture
   */
  static async getRecommendations({ userId = null, sessionId = null, anonymousId = null, limit = 6, productId = null }) {
    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 6));
    const targetUserId = userId ? Number(userId) : null;
    const targetProdId = productId ? Number(productId) : null;

    let contextProductIds = [];
    if (targetProdId) {
      contextProductIds = [targetProdId];
    } else if (targetUserId || sessionId || anonymousId) {
      // 1. Tìm các sản phẩm người dùng vừa tương tác trong Session / Lịch sử
      const recentEvents = await query(`
        SELECT TOP 4 product_id, COUNT(*) AS interaction_count, MAX(event_timestamp) AS last_interaction
        FROM user_events
        WHERE product_id IS NOT NULL
          AND (
            (@targetUserId IS NOT NULL AND user_id = @targetUserId)
            OR (@sessionId IS NOT NULL AND session_id = @sessionId)
            OR (@anonymousId IS NOT NULL AND anonymous_id = @anonymousId)
          )
        GROUP BY product_id
        ORDER BY last_interaction DESC
      `, {
        targetUserId,
        sessionId: sessionId || null,
        anonymousId: anonymousId || null
      });

      if (recentEvents.recordset.length > 0) {
        contextProductIds = recentEvents.recordset.map(r => r.product_id);
      }
    }

    let recommendedProducts = [];
    let isPersonalized = false;

    // 2. NẾU CÓ DỮ LIỆU TƯƠNG TÁC -> THỰC HIỆN CONTENT-BASED & SESSION-BASED FILTERING
    if (contextProductIds.length > 0) {
      const contextInfo = await query(`
        SELECT p.id, p.category_id, p.base_price, badge.tag, p.material, p.fit
        FROM products p
        ${productBadgeJoin}
        WHERE p.id IN (${contextProductIds.join(',')})
      `);

      if (contextInfo.recordset.length > 0) {
        const catIds = [...new Set(contextInfo.recordset.map(p => p.category_id).filter(Boolean))];
        const materials = [...new Set(contextInfo.recordset.map(p => p.material).filter(Boolean))];
        const tags = [...new Set(contextInfo.recordset.map(p => p.tag).filter(Boolean))];
        const avgPrice = contextInfo.recordset.reduce((s, p) => s + Number(p.base_price || 0), 0) / contextInfo.recordset.length;

        // Tính điểm tương đồng Content-based trên SQL Server
        const catListStr = catIds.length ? catIds.join(',') : '0';
        const excludeListStr = contextProductIds.join(',');

        const contentQuery = `
          SELECT TOP ${safeLimit}
            p.id,
            p.name,
            p.slug,
            p.description,
            p.base_price AS price,
            badge.tag,
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
            COUNT(r.id) AS reviewCount,
            -- Thuật toán tính trọng số tương đồng phong cách
            (
              CASE WHEN p.category_id IN (${catListStr}) THEN 40 ELSE 0 END +
              CASE WHEN p.material IN (${materials.map(m => `'${m.replace(/'/g, "''")}'`).join(',') || "''"}) THEN 30 ELSE 0 END +
              CASE WHEN badge.tag IN (${tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',') || "''"}) THEN 15 ELSE 0 END +
              CASE WHEN ABS(p.base_price - ${avgPrice}) <= (${avgPrice} * 0.4) THEN 15 ELSE 5 END
            ) AS similarity_score
          FROM products p
          ${productBadgeJoin}
          OUTER APPLY (SELECT SUM(pv.stock_quantity) AS stock_quantity FROM product_variants pv WHERE pv.product_id=p.id) stock
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN (
            SELECT product_id, image_url, ROW_NUMBER() OVER(PARTITION BY product_id ORDER BY is_thumbnail DESC, id ASC) AS rn
            FROM product_images
          ) img ON p.id = img.product_id AND img.rn = 1
          LEFT JOIN product_reviews r ON p.id = r.product_id
          WHERE p.is_active = 1
            AND p.id NOT IN (${excludeListStr})
            AND COALESCE(stock.stock_quantity, 0) > 0
          GROUP BY 
            p.id, p.name, p.slug, p.description, p.base_price, badge.tag, p.material, p.fit, p.lining, p.hardware, p.origin,
            p.created_at, stock.stock_quantity, c.name, c.slug, img.image_url, p.category_id
          ORDER BY similarity_score DESC, rating DESC, p.created_at DESC
        `;

        const contentResult = await query(contentQuery);
        if (contentResult.recordset.length > 0) {
          isPersonalized = true;
          recommendedProducts = contentResult.recordset.map(item => ({
            ...item,
            recommendationReason: 'Gợi ý phù hợp với trang phục & chất liệu bạn vừa quan tâm',
            isPersonalized: true
          }));
        }
      }
    }

    // 3. NẾU CHƯA ĐỦ SỐ LƯỢNG (COLD-START / KHÁCH MỚI) -> BỔ SUNG BẰNG POPULARITY-BASED (BÁN CHẠY / RATING CAO)
    if (recommendedProducts.length < safeLimit) {
      const needed = safeLimit - recommendedProducts.length;
      const alreadyIds = [...contextProductIds, ...recommendedProducts.map(p => p.id)];
      const excludeClause = alreadyIds.length > 0 ? `AND p.id NOT IN (${alreadyIds.join(',')})` : '';

      const popQuery = `
        SELECT TOP ${needed}
          p.id,
          p.name,
          p.slug,
          p.description,
          p.base_price AS price,
          badge.tag,
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
          COUNT(r.id) AS reviewCount,
          COALESCE(sales.sold_units, 0) AS sold_units
        FROM products p
        ${productBadgeJoin}
        OUTER APPLY (SELECT SUM(pv.stock_quantity) AS stock_quantity FROM product_variants pv WHERE pv.product_id=p.id) stock
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
          SELECT product_id, image_url, ROW_NUMBER() OVER(PARTITION BY product_id ORDER BY is_thumbnail DESC, id ASC) AS rn
          FROM product_images
        ) img ON p.id = img.product_id AND img.rn = 1
        LEFT JOIN product_reviews r ON p.id = r.product_id
        WHERE p.is_active = 1
          AND COALESCE(stock.stock_quantity, 0) > 0
          ${excludeClause}
        GROUP BY 
          p.id, p.name, p.slug, p.description, p.base_price, badge.tag, p.material, p.fit, p.lining, p.hardware, p.origin,
          p.created_at, stock.stock_quantity, c.name, c.slug, img.image_url, sales.sold_units
        ORDER BY sold_units DESC, rating DESC, p.created_at DESC
      `;

      const popResult = await query(popQuery);
      const popItems = popResult.recordset.map(item => ({
        ...item,
        recommendationReason: isPersonalized 
          ? 'Tuyệt tác thời trang may đo đồng điệu'
          : 'Bộ sưu tập Haute Couture thịnh hành được yêu thích nhất',
        isPersonalized: false
      }));

      recommendedProducts = [...recommendedProducts, ...popItems];
    }

    return {
      items: recommendedProducts.slice(0, safeLimit),
      total: recommendedProducts.length,
      mode: isPersonalized ? 'PERSONALIZED_HYBRID' : 'POPULARITY_TRENDING',
      contextProductCount: contextProductIds.length
    };
  }
}

module.exports = RecommendationService;
