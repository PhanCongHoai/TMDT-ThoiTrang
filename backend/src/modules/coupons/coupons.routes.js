const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const ApiResponse = require('../../utils/response');

router.post('/apply', async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const amount = Number(orderAmount) || 0;
    const couponCode = (code || '').trim().toUpperCase();

    const result = await query(`
      SELECT * FROM coupons 
      WHERE code = @code AND is_active = 1
    `, { code: couponCode });

    if (!result.recordset.length) {
      return ApiResponse.error(res, 'Mã giảm giá không hợp lệ hoặc đã hết hạn!', 404);
    }

    const coupon = result.recordset[0];
    if (amount < coupon.min_order_amount) {
      return ApiResponse.error(
        res,
        `Mã ${coupon.code} chỉ áp dụng cho đơn hàng từ ${Number(coupon.min_order_amount).toLocaleString('vi-VN')} ₫`,
        400
      );
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENT') {
      discountAmount = Math.min((amount * Number(coupon.discount_value)) / 100, Number(coupon.max_discount_amount || 999999999));
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    return ApiResponse.success(res, {
      code: coupon.code,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount)
    }, `Áp dụng thành công mã ưu đãi ${coupon.code}!`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

