const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const ApiResponse = require('../utils/response');

/**
 * Middleware: Yêu cầu Bearer JWT hợp lệ
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Yêu cầu xác thực. Vui lòng đăng nhập.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, fullName }
    next();
  } catch (err) {
    return ApiResponse.error(res, 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }
}

/**
 * Middleware: Chỉ cho phép tài khoản có quyền ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return ApiResponse.error(res, 'Bạn không có quyền truy cập tính năng này.', 403);
  }
  next();
}

/**
 * Middleware: Tùy chọn token (nếu có thì giải mã, không bắt buộc)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // bỏ qua nếu token không hợp lệ
    }
  }
  next();
}

module.exports = { verifyToken, requireAdmin, optionalAuth };

