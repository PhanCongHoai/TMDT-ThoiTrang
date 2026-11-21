const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
        if (!Number.isInteger(targetUserId) || targetUserId <= 0) return ApiResponse.error(res, 'Mã khách hàng không hợp lệ', 400);
      } else if (req.query.email) {
        const byEmail = await query('SELECT id FROM users WHERE email = @email', { email: req.query.email.trim() });
        if (byEmail.recordset.length) targetUserId = byEmail.recordset[0].id;
      }
    }

    const userResult = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.address, u.vip_tier, u.vip_points, u.total_spent, u.created_at, r.role_name
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

// POST Create User by Admin
router.post('/', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const { fullName, email, password, phone, address, vipTier, roleName } = req.body;
    if (!fullName || !email || !password) {
      return ApiResponse.error(res, 'Vui lòng cung cấp đầy đủ Họ tên, Email và Mật khẩu.', 400);
    }
    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return ApiResponse.error(res, 'Mật khẩu phải có ít nhất 6 ký tự.', 400);
    }

    const checkExist = await query('SELECT id FROM users WHERE email = @email', { email: cleanEmail });
    if (checkExist.recordset.length) {
      return ApiResponse.error(res, 'Email này đã được sử dụng bởi một tài khoản khác.', 409);
    }

    let targetRoleId = 2; // Default CUSTOMER
    if (roleName && roleName.toUpperCase() === 'ADMIN') {
      const rCheck = await query("SELECT id FROM roles WHERE role_name = 'ADMIN'");
      if (rCheck.recordset.length) targetRoleId = rCheck.recordset[0].id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tier = vipTier ? vipTier.trim().toUpperCase() : 'STANDARD';

    const insertResult = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, address, role_id, vip_tier, vip_points, total_spent, created_at)
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.address, INSERTED.vip_tier, INSERTED.vip_points, INSERTED.total_spent, INSERTED.created_at
      VALUES (@fullName, @email, @passwordHash, @phone, @address, @roleId, @vipTier, 0, 0, SYSDATETIME())
    `, {
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      roleId: targetRoleId,
      vipTier: tier
    });

    const newUser = insertResult.recordset[0];
    newUser.role_name = targetRoleId === 1 ? 'ADMIN' : 'CUSTOMER';

    return ApiResponse.success(res, newUser, `Tạo tài khoản khách hàng "${newUser.full_name}" thành công!`, 201);
  } catch (err) {
    next(err);
  }
});

// PUT Update User by Admin
router.put('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return ApiResponse.error(res, 'Mã khách hàng không hợp lệ.', 400);
    }

    const checkUser = await query('SELECT id, email, role_id FROM users WHERE id = @id', { id: targetUserId });
    if (!checkUser.recordset.length) {
      return ApiResponse.error(res, 'Không tìm thấy tài khoản khách hàng.', 404);
    }

    const { fullName, phone, address, vipTier, vipPoints, roleName, newPassword } = req.body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return ApiResponse.error(res, 'Họ và tên không được để trống.', 400);
    }

    let roleId = checkUser.recordset[0].role_id;
    if (roleName) {
      const rCheck = await query('SELECT id FROM roles WHERE role_name = @roleName', { roleName: roleName.toUpperCase() });
      if (rCheck.recordset.length) {
        roleId = rCheck.recordset[0].id;
      }
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(newPassword.trim(), 12);
      await query('UPDATE users SET password_hash = @passwordHash WHERE id = @id', { id: targetUserId, passwordHash });
    }

    await query(`
      UPDATE users
      SET full_name = @fullName,
          phone = @phone,
          address = @address,
          vip_tier = @vipTier,
          vip_points = COALESCE(@vipPoints, vip_points),
          role_id = @roleId
      WHERE id = @id
    `, {
      id: targetUserId,
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      vipTier: vipTier ? vipTier.trim().toUpperCase() : 'STANDARD',
      vipPoints: vipPoints !== undefined ? Number(vipPoints) : null,
      roleId
    });

    const updatedUserResult = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.address, u.vip_tier, u.vip_points, u.total_spent, r.role_name, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = @id
    `, { id: targetUserId });

    return ApiResponse.success(res, updatedUserResult.recordset[0], 'Đã cập nhật thông tin khách hàng thành công!');
  } catch (err) {
    next(err);
  }
});

// DELETE User by Admin
router.delete('/:id', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return ApiResponse.error(res, 'Mã khách hàng không hợp lệ.', 400);
    }

    if (targetUserId === req.user.id) {
      return ApiResponse.error(res, 'Quản trị viên không thể tự xóa tài khoản của chính mình.', 400);
    }

    const checkUser = await query('SELECT id, full_name, email FROM users WHERE id = @id', { id: targetUserId });
    if (!checkUser.recordset.length) {
      return ApiResponse.error(res, 'Tài khoản không tồn tại hoặc đã được xóa trước đó.', 404);
    }

    const orderCheck = await query('SELECT COUNT(*) AS total_orders FROM orders WHERE user_id = @id', { id: targetUserId });
    if (orderCheck.recordset[0].total_orders > 0) {
      return ApiResponse.error(res, `Không thể xóa khách hàng "${checkUser.recordset[0].full_name}" vì đã phát sinh ${orderCheck.recordset[0].total_orders} đơn hàng trong hệ thống (nhằm đảm bảo tính toàn vẹn dữ liệu kế toán và hóa đơn). Quý khách có thể sửa thông tin hoặc đổi hạng tài khoản.`, 400);
    }

    await query('DELETE FROM wishlists WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM product_interactions WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM user_search_history WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM user_events WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM user_sessions WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM abandoned_carts WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM tracking_consents WHERE user_id = @id', { id: targetUserId });
    await query('DELETE FROM ai_chat_sessions WHERE user_id = @id', { id: targetUserId });

    await query('DELETE FROM users WHERE id = @id', { id: targetUserId });
    return ApiResponse.success(res, null, `Đã xóa tài khoản "${checkUser.recordset[0].full_name}" thành công!`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
