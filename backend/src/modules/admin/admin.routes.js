const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/response');

// GET Admin Dashboard Stats
router.get('/stats', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const revResult = await query(`SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS total_orders FROM orders`);
    const prodResult = await query(`SELECT COUNT(*) AS total_products FROM products WHERE is_active = 1`);
    const userResult = await query(`SELECT COUNT(*) AS total_users FROM users`);
    const reviewResult = await query(`SELECT COUNT(*) AS total_reviews, COALESCE(AVG(CAST(rating AS FLOAT)), 5.0) AS avg_rating FROM product_reviews`);
    const catResult = await query(`
      SELECT c.name, COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1 
      GROUP BY c.name
    `);

    const revSummary = revResult.recordset[0];
    const reviewSummary = reviewResult.recordset[0];

    return ApiResponse.success(res, {
      totalRevenue: Number(revSummary.total_revenue),
      totalOrders: Number(revSummary.total_orders),
      totalProducts: Number(prodResult.recordset[0].total_products),
      totalCustomers: Number(userResult.recordset[0].total_users),
      totalReviews: Number(reviewSummary.total_reviews),
      avgRating: Number(Number(reviewSummary.avg_rating).toFixed(1)),
      categories: catResult.recordset
    }, 'Lấy thống kê admin thành công');
  } catch (err) {
    next(err);
  }
});

// GET Inventory Batches
router.get('/inventory/batches', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM inventory_imports ORDER BY created_at DESC`);
    return ApiResponse.success(res, result.recordset, 'Lấy danh sách lô hàng thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

// POST Inventory Batch Import
router.post('/inventory/batch-import', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { batchCode, supplier, quantity, totalCost, notes } = req.body;
    if (!batchCode || !quantity) {
      return ApiResponse.error(res, 'Mã lô hàng và số lượng nhập là bắt buộc', 400);
    }

    await query(`
      INSERT INTO inventory_imports (batch_code, supplier_name, total_quantity, total_cost, imported_by, notes)
      VALUES (@batchCode, @supplier, @quantity, @totalCost, 'Admin System', @notes)
    `, {
      batchCode,
      supplier: supplier || 'Nhà Cung Cấp Milano (Ý)',
      quantity: Number(quantity),
      totalCost: Number(totalCost) || (Number(quantity) * 9000000),
      notes: notes || 'Nhập kho phục vụ BST Haute Couture'
    });

    return ApiResponse.success(res, null, `Đã nhập thành công lô hàng ${batchCode} (${quantity} items) vào Cơ Sở Dữ Liệu!`, 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

