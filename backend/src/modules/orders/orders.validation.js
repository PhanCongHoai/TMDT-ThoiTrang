const ApiResponse = require('../../utils/response');
const { PAYMENT_METHOD } = require('./orders.constants');

/**
 * Validation Middleware cho Module Orders
 */
class OrderValidation {
  static validateCreateOrder(req, res, next) {
    const { fullName, phone, address, cartItems, items, paymentMethod } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return ApiResponse.error(res, 'Họ và tên người nhận là bắt buộc.', 400);
    }
    if (fullName.trim().length > 100) {
      return ApiResponse.error(res, 'Họ tên không được vượt quá 100 ký tự.', 400);
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return ApiResponse.error(res, 'Số điện thoại người nhận là bắt buộc.', 400);
    }
    const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
    if (!/^(0|\+84)[0-9]{8,11}$/.test(cleanPhone)) {
      return ApiResponse.error(res, 'Số điện thoại không đúng định dạng.', 400);
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return ApiResponse.error(res, 'Địa chỉ giao hàng quá ngắn hoặc không hợp lệ (tối thiểu 5 ký tự).', 400);
    }

    const orderItems = cartItems || items;
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return ApiResponse.error(res, 'Giỏ hàng rỗng, không thể tạo đơn hàng.', 400);
    }

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item || typeof item !== 'object') {
        return ApiResponse.error(res, `Dữ liệu sản phẩm thứ ${i + 1} không hợp lệ.`, 400);
      }

      const qty = Number(item.quantity !== undefined ? item.quantity : item.qty);
      if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
        return ApiResponse.error(res, `Số lượng sản phẩm thứ ${i + 1} phải là số nguyên lớn hơn 0.`, 400);
      }
      if (qty > 100) {
        return ApiResponse.error(res, `Số lượng sản phẩm thứ ${i + 1} vượt quá giới hạn đặt hàng (tối đa 100).`, 400);
      }

      const hasId = item.variantId || item.variant_id || item.productId || item.id;
      if (!hasId) {
        return ApiResponse.error(res, `Sản phẩm thứ ${i + 1} thiếu thông tin định danh sản phẩm.`, 400);
      }
    }

    if (paymentMethod && !Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
      return ApiResponse.error(res, `Phương thức thanh toán "${paymentMethod}" không được hỗ trợ.`, 400);
    }

    next();
  }

  static validateOrderCode(req, res, next) {
    const code = req.params.orderCode || req.params.code;
    if (!code || typeof code !== 'string' || code.trim().length === 0 || code.length > 50) {
      return ApiResponse.error(res, 'Mã đơn hàng không hợp lệ.', 400);
    }
    next();
  }
}

module.exports = OrderValidation;

