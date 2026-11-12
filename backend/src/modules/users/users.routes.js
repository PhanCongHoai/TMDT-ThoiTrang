const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/response');

/**
 * Module Users - Quản lý hồ sơ cá nhân và người dùng
 * Đã khắc phục lỗ hổng IDOR (AUDIT-001) bằng Strict Token Verification
 */

// GET User Profile (Yêu cầu đăng nhập, chỉ xem hồ sơ của chính mình hoặc Admin xem user khác)
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    let targetUserId = req.user.id;

    // Nếu là Admin và có truyền userId hoặc email để tra cứu
    if (req.user.role === 'ADMIN') {
      if (req.query.userId) {
        targetUserId = Number(req.query.userId);
      } else if (req.query.email) {
        const byEmail = await query('SELECT id FROM users WHERE email = @email', { email: req.query.email.trim() });
        if (byEmail.recordset.length) targetUserId = byEmail.recordset[0].id;
      }
    }

    const userResult = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.address, u.vip_tier, u.vip_points, u.total_spent, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = @userId
    `, { userId: targetUserId });

    if (!userResult.recordset.length) {
      return ApiResponse.error(res, 'Không tìm thấy thông tin tài khoản', 404);
    }

    const user = userResult.recordset[0];
    const ordersResult = await query(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
      FROM orders o
      WHERE o.user_id = @userId
      ORDER BY o.created_at DESC
    `, { userId: user.id });

    user.orders = ordersResult.recordset;
    return ApiResponse.success(res, user, 'Lấy thông tin tài khoản thành công');
  } catch (err) {
    next(err);
  }
});

// PUT Update User Profile (Chỉ cập nhật tài khoản của chính mình)
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const { fullName, phone, address } = req.body;
    const userId = req.user.id;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return ApiResponse.error(res, 'Họ và tên không được để trống.', 400);
    }

    await query(`
      UPDATE users 
      SET full_name = @fullName, phone = @phone, address = @address
      WHERE id = @userId
    `, {
      userId,
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : ''
    });

    return ApiResponse.success(res, null, 'Đã cập nhật thông tin tài khoản thành công!');
  } catch (err) {
    next(err);
  }
});

// GET Shipping Info (Dùng khi checkout)
router.get('/shipping-info', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT full_name, phone, address FROM users WHERE id = @userId', { userId });
    if (!result.recordset.length) {
      return ApiResponse.error(res, 'Không tìm thấy thông tin giao hàng.', 404);
    }
    const u = result.recordset[0];
    return ApiResponse.success(res, {
      fullName: u.full_name,
      phone: u.phone || '',
      address: u.address || ''
    });
  } catch (err) {
    next(err);
  }
});

// GET All Users (Admin-only)
router.get('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.address, u.vip_tier, u.vip_points, u.total_spent, r.role_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    return ApiResponse.success(res, result.recordset, 'Lấy danh sách khách hàng thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
