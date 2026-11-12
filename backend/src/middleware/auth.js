// ====================================================================
// AURALIÈ - JWT Auth Middleware
// Bảo vệ các route yêu cầu xác thực & phân quyền
// ====================================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_auralie_2026';

/**
 * Middleware: Yêu cầu token hợp lệ
 * Token được đọc từ Authorization header: "Bearer <token>"
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Yêu cầu xác thực. Vui lòng đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, fullName }
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
}

/**
 * Middleware: Chỉ cho phép ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Bạn không có quyền truy cập tính năng này.' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };

