/**
 * Chuẩn hóa cấu trúc HTTP Response toàn hệ thống
 */
class ApiResponse {
  static success(res, data = null, message = 'Thao tác thành công', statusCode = 200, extra = {}) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      ...(data !== null ? { data } : {}),
      ...extra
    });
  }

  static error(res, message = 'Đã có lỗi xảy ra', statusCode = 500, errors = null) {
    const payload = {
      status: 'error',
      message
    };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;

