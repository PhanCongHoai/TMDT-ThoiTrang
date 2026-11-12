const AuthService = require('./auth.service');
const ApiResponse = require('../../utils/response');

class AuthController {
  static async register(req, res, next) {
    try {
      const { fullName, email, password, phone } = req.body;
      if (!fullName || !email || !password) {
        return ApiResponse.error(res, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.', 400);
      }
      if (password.length < 6) {
        return ApiResponse.error(res, 'Mật khẩu phải có ít nhất 6 ký tự.', 400);
      }

      const result = await AuthService.register({ fullName, email, password, phone });
      return ApiResponse.success(res, result.user, `Chào mừng ${fullName} đến với AURALIÈ Haute Couture!`, 201, {
        token: result.token
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return ApiResponse.error(res, 'Vui lòng nhập email và mật khẩu.', 400);
      }

      const result = await AuthService.login({ email, password });
      return ApiResponse.success(res, result.user, `Đăng nhập thành công! Chào mừng ${result.user.fullName}.`, 200, {
        token: result.token
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      return ApiResponse.success(res, user, 'Lấy thông tin tài khoản thành công');
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return ApiResponse.error(res, 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.', 400);
      }
      if (newPassword.length < 6) {
        return ApiResponse.error(res, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
      }

      await AuthService.changePassword(req.user.id, { currentPassword, newPassword });
      return ApiResponse.success(res, null, 'Đã cập nhật mật khẩu thành công!');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;

