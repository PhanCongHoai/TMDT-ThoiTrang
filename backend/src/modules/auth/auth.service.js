const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

class AuthService {
  static async register({ fullName, email, password, phone }) {
    const cleanEmail = email.toLowerCase().trim();

    // Kiểm tra trùng email
    const existing = await query('SELECT id FROM users WHERE email = @email', { email: cleanEmail });
    if (existing.recordset.length > 0) {
      const err = new Error('Email này đã được đăng ký. Vui lòng đăng nhập.');
      err.statusCode = 409;
      throw err;
    }

    // Lấy role CUSTOMER
    const roleRes = await query("SELECT id FROM roles WHERE role_name = 'CUSTOMER'");
    const customerRoleId = roleRes.recordset.length > 0 ? roleRes.recordset[0].id : 2;

    // Mã hóa mật khẩu an toàn với bcrypt (salt = 12)
    const passwordHash = await bcrypt.hash(password, 12);

    const insertRes = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, role_id, vip_tier, vip_points, total_spent)
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.vip_tier
      VALUES (@fullName, @email, @passwordHash, @phone, @roleId, 'SILVER VIP', 0, 0)
    `, {
      fullName,
      email: cleanEmail,
      passwordHash,
      phone: phone || '',
      roleId: customerRoleId
    });

    const newUser = insertRes.recordset[0];

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'CUSTOMER', fullName: newUser.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: 'CUSTOMER',
        vipTier: newUser.vip_tier
      }
    };
  }

  static async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();

    const result = await query(`
      SELECT u.id, u.full_name, u.email, u.password_hash, u.phone, u.address,
             u.vip_tier, u.vip_points, u.total_spent, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = @email
    `, { email: cleanEmail });

    if (!result.recordset.length) {
      const err = new Error('Email hoặc mật khẩu không chính xác.');
      err.statusCode = 401;
      throw err;
    }

    const user = result.recordset[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const err = new Error('Email hoặc mật khẩu không chính xác.');
      err.statusCode = 401;
      throw err;
    }

    const role = user.role_name || 'CUSTOMER';
    const token = jwt.sign(
      { id: user.id, email: user.email, role, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role,
        vipTier: user.vip_tier,
        vipPoints: user.vip_points,
        totalSpent: Number(user.total_spent)
      }
    };
  }

  static async getMe(userId) {
    const result = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.address,
             u.vip_tier, u.vip_points, u.total_spent, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = @id
    `, { id: userId });

    if (!result.recordset.length) {
      const err = new Error('Không tìm thấy thông tin tài khoản.');
      err.statusCode = 404;
      throw err;
    }

    const u = result.recordset[0];
    return {
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      role: u.role_name,
      vipTier: u.vip_tier,
      vipPoints: u.vip_points,
      totalSpent: Number(u.total_spent)
    };
  }

  static async changePassword(userId, { currentPassword, newPassword }) {
    const result = await query('SELECT password_hash FROM users WHERE id = @userId', { userId });
    if (!result.recordset.length) {
      const err = new Error('Không tìm thấy tài khoản.');
      err.statusCode = 404;
      throw err;
    }

    const isValid = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
    if (!isValid) {
      const err = new Error('Mật khẩu hiện tại không đúng.');
      err.statusCode = 401;
      throw err;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = @newHash WHERE id = @userId', { userId, newHash });
    return true;
  }
}

module.exports = AuthService;

