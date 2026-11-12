const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('./orders.constants');

/**
 * Ma trận chuyển đổi trạng thái đơn hàng (Order State Machine)
 * Đảm bảo tính toàn vẹn dữ liệu, chống vi phạm luồng xuất nhập kho và kế toán
 */
const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.CONFIRMED]: [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED // Trường hợp khách từ chối nhận, hoàn kho
  ],
  [ORDER_STATUS.COMPLETED]: [], // Trạng thái kết thúc - Không cho phép chuyển ngược
  [ORDER_STATUS.CANCELLED]: []  // Trạng thái hủy - Tồn kho đã hoàn, không cho phép kích hoạt lại
};

class OrderStateMachine {
  /**
   * Kiểm tra chuyển trạng thái có hợp lệ hay không
   */
  static validateTransition(currentStatus, newStatus, order = null) {
    if (!currentStatus || !newStatus) {
      const err = new Error('Trạng thái hiện tại và trạng thái mới là bắt buộc.');
      err.statusCode = 400;
      throw err;
    }

    if (currentStatus === newStatus) {
      return true; // Không thay đổi gì
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      const err = new Error(`Không thể chuyển trạng thái đơn hàng từ "${currentStatus}" sang "${newStatus}". Luồng trạng thái không hợp lệ.`);
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra quy tắc nghiệp vụ đặc thù
    if (order) {
      // 1. Không cho phép chuyển sang SHIPPED hoặc COMPLETED nếu đơn thanh toán online (VISA / SePay) mà chưa thanh toán
      if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED].includes(newStatus)) {
        if (order.payment_method !== PAYMENT_METHOD.COD && order.payment_status !== PAYMENT_STATUS.PAID) {
          const err = new Error(`Đơn hàng (${order.payment_method}) chưa thanh toán (Trạng thái: ${order.payment_status}), không thể xuất kho hoặc hoàn thành.`);
          err.statusCode = 400;
          throw err;
        }
      }

      // 2. Không cho phép hủy đơn đã COMPLETED
      if (currentStatus === ORDER_STATUS.COMPLETED && newStatus === ORDER_STATUS.CANCELLED) {
        const err = new Error('Đơn hàng đã hoàn tất giao hàng thành công, không thể hủy đơn trực tiếp.');
        err.statusCode = 400;
        throw err;
      }
    }

    return true;
  }
}

module.exports = {
  OrderStateMachine,
  ALLOWED_TRANSITIONS
};

