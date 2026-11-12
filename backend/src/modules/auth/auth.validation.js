/**
 * Validation Middleware cho Module Auth
 * Kiểm tra kiểu dữ liệu, độ dài và định dạng email trước khi vào Controller/Service
 */
const ApiResponse = require('../../utils/response');

class AuthValidation {
  static validateRegister(req, res, next) {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return ApiResponse.error(res, 'Vui lòng nhập họ và tên hợp lệ.', 400);
    }
    if (fullName.trim().length > 100) {
      return ApiResponse.error(res, 'Họ và tên không được vượt quá 100 ký tự.', 400);
    }

    if (!email || typeof email !== 'string') {
      return ApiResponse.error(res, 'Vui lòng cung cấp địa chỉ email.', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return ApiResponse.error(res, 'Định dạng email không hợp lệ.', 400);
    }

    if (!password || typeof password !== 'string') {
      return ApiResponse.error(res, 'Vui lòng nhập mật khẩu.', 400);
    }
    if (password.length < 6) {
      return ApiResponse.error(res, 'Mật khẩu phải có ít nhất 6 ký tự.', 400);
    }
    if (password.length > 128) {
      return ApiResponse.error(res, 'Mật khẩu không được vượt quá 128 ký tự.', 400);
    }

    if (phone && (typeof phone !== 'string' || phone.length > 20)) {
      return ApiResponse.error(res, 'Số điện thoại không hợp lệ.', 400);
    }

    next();
  }

  static validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return ApiResponse.error(res, 'Vui lòng nhập email đăng nhập.', 400);
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return ApiResponse.error(res, 'Vui lòng nhập mật khẩu.', 400);
    }

    next();
  }

  static validateChangePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return ApiResponse.error(res, 'Vui lòng nhập mật khẩu hiện tại.', 400);
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return ApiResponse.error(res, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
    }
    if (newPassword.length > 128) {
      return ApiResponse.error(res, 'Mật khẩu mới không được vượt quá 128 ký tự.', 400);
    }

    next();
  }
}

module.exports = AuthValidation;

