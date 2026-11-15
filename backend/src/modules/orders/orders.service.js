const OrderRepository = require('./orders.repository');
const { SEPAY } = require('../../config/env');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, ORDER_HOLD_MINUTES } = require('./orders.constants');
const { OrderStateMachine } = require('./orders.state-machine');
const { query } = require('../../config/db');

/**
 * OrderService - Xử lý Business Logic cho Đơn Hàng & Tồn Kho & SePay
 */
class OrderService {
  static getSepayConfig() {
    return SEPAY;
  }

  /**
   * Tạo Đơn Hàng & Giữ Tồn Kho (Phase 3.3.1)
   * - Tính giá 100% từ database, không tin tưởng giá từ Frontend.
   * - Xác thực biến thể, tồn kho và trạng thái kích hoạt của sản phẩm.
   * - Xác thực mã giảm giá (coupon) từ CSDL.
   * - Thực thi trong SQL Transaction nguyên tử với UPDLOCK / ROWLOCK.
   * - Giữ hàng trong 15 phút cho thanh toán SePay VietQR.
   */
  static async createOrder({ fullName, phone, address, cartItems, items, paymentMethod, couponCode, user }) {
    if (!user || !user.id) {
      const err = new Error('Vui lòng đăng nhập trước khi đặt hàng.');
      err.statusCode = 401;
      throw err;
    }
    const rawItems = cartItems || items || [];
    if (!rawItems.length) {
      const err = new Error('Giỏ hàng không có sản phẩm');
      err.statusCode = 400;
      throw err;
    }

    // 1. Xác thực và tính giá từng sản phẩm từ Database
    const resolvedItems = [];
    let subtotal = 0;

    for (const rawItem of rawItems) {
      const resolved = await OrderRepository.resolveItemDetails(rawItem);
      if (!resolved) {
        const itemIdentifier = rawItem.name || rawItem.id || rawItem.variantId;
        const err = new Error(`Không tìm thấy sản phẩm "${itemIdentifier}" trong hệ thống.`);
        err.statusCode = 400;
        throw err;
      }

      if (resolved.product_active === false || resolved.product_active === 0) {
        const err = new Error(`Sản phẩm "${resolved.product_name}" hiện đã ngừng kinh doanh.`);
        err.statusCode = 400;
        throw err;
      }

      const qty = Number(rawItem.quantity !== undefined ? rawItem.quantity : rawItem.qty) || 1;
      const currentStock = resolved.stock_quantity !== null && resolved.stock_quantity !== undefined ? Number(resolved.stock_quantity) : 0;
      if (currentStock < qty) {
        const err = new Error(`Sản phẩm "${resolved.product_name}" (${resolved.size} / ${resolved.color}) không đủ tồn kho (còn ${currentStock}, yêu cầu ${qty}).`);
        err.statusCode = 400;
        throw err;
      }

      // Giá chuẩn lấy từ biến thể hoặc giá gốc của sản phẩm
      const itemPrice = Number(resolved.variant_price !== null && resolved.variant_price !== undefined ? resolved.variant_price : resolved.base_price);
      subtotal += itemPrice * qty;

      resolvedItems.push({
        variant_id: resolved.variant_id,
        product_id: resolved.product_id,
        product_name: resolved.product_name,
        size: resolved.size,
        color: resolved.color,
        sku: resolved.sku,
        price: itemPrice,
        quantity: qty
      });
    }

    // 2. Kiểm tra Coupon giảm giá từ Database (nếu có)
    let discountAmount = 0;
    let couponId = null;

    if (couponCode && String(couponCode).trim()) {
      const coupon = await OrderRepository.findCouponByCode(couponCode);
      if (!coupon) {
        const err = new Error(`Mã giảm giá "${couponCode}" không tồn tại hoặc đã bị vô hiệu hóa.`);
        err.statusCode = 400;
        throw err;
      }

      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
        const err = new Error(`Mã giảm giá "${couponCode}" đã hết hạn sử dụng.`);
        err.statusCode = 400;
        throw err;
      }

      if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
        const err = new Error(`Mã giảm giá "${couponCode}" đã đạt giới hạn lượt sử dụng.`);
        err.statusCode = 400;
        throw err;
      }

      const minOrder = Number(coupon.min_order_amount) || 0;
      if (subtotal < minOrder) {
        const err = new Error(`Đơn hàng phải từ ${minOrder.toLocaleString('vi-VN')} đ để áp dụng mã giảm giá này.`);
        err.statusCode = 400;
        throw err;
      }

      couponId = coupon.id;
      if (coupon.discount_type === 'PERCENT') {
        const percentDiscount = Math.round((subtotal * Number(coupon.discount_value)) / 100);
        discountAmount = coupon.max_discount_amount 
          ? Math.min(percentDiscount, Number(coupon.max_discount_amount)) 
          : percentDiscount;
      } else {
        discountAmount = Number(coupon.discount_value);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }

    // 3. Tính phí vận chuyển (Auralie Haute Couture miễn phí vận chuyển toàn quốc)
    const shippingFee = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // 4. Sinh mã đơn hàng và mã vận đơn chống va chạm
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderCode = `AUR-${dateStr}-${randSuffix}`;
    const trackingCode = `GHN-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 5. Xác định User ID: Nếu đã đăng nhập thì lưu ID, nếu khách vãng lai thì lưu NULL (không mặc định id=2)
    const userId = (user && user.id) ? Number(user.id) : null;

    // 6. Xác định Phương thức & Trạng thái thanh toán
    const effectivePaymentMethod = paymentMethod || PAYMENT_METHOD.SEPAY_QR;
    let paymentStatus = PAYMENT_STATUS.UNPAID;
    let orderStatus = ORDER_STATUS.PENDING;

    if (effectivePaymentMethod === PAYMENT_METHOD.VISA) {
      paymentStatus = PAYMENT_STATUS.PAID;
      orderStatus = ORDER_STATUS.CONFIRMED;
    } else if (effectivePaymentMethod === PAYMENT_METHOD.COD) {
      paymentStatus = PAYMENT_STATUS.UNPAID;
      orderStatus = ORDER_STATUS.CONFIRMED;
    } else {
      // SEPAY_QR: Giữ trạng thái PENDING chờ Webhook SePay
      paymentStatus = PAYMENT_STATUS.UNPAID;
      orderStatus = ORDER_STATUS.PENDING;
    }

    // 7. Thực thi Transaction tạo đơn hàng và trừ kho nguyên tử
    const orderId = await OrderRepository.createOrderWithReservation({
      orderData: {
        userId,
        orderCode,
        totalAmount,
        discountAmount,
        shippingFee,
        shippingAddress: address.trim(),
        phoneNumber: phone.trim(),
        paymentMethod: effectivePaymentMethod,
        paymentStatus,
        trackingCode,
        status: orderStatus
      },
      items: resolvedItems,
      couponId
    });

    // 8. Cấu hình thông tin chuyển khoản VietQR SePay
    const sepayCfg = this.getSepayConfig();
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(sepayCfg.accountNumber)}&bank=${encodeURIComponent(sepayCfg.bankShortName)}&amount=${totalAmount}&des=${encodeURIComponent(orderCode)}&template=compact`;

    return {
      orderId,
      orderCode,
      trackingCode,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      paymentMethod: effectivePaymentMethod,
      paymentStatus,
      status: orderStatus,
      qrCodeUrl,
      bankInfo: {
        bankCode: sepayCfg.bankCode,
        bankShortName: sepayCfg.bankShortName,
        accountNumber: sepayCfg.accountNumber,
        accountName: sepayCfg.accountName,
        transferAmount: totalAmount,
        transferContent: orderCode
      },
      items: resolvedItems.map(it => ({
        variantId: it.variant_id,
        name: it.product_name,
        size: it.size,
        color: it.color,
        price: it.price,
        quantity: it.quantity,
        lineTotal: it.price * it.quantity
      })),
      holdExpiresAt: new Date(Date.now() + ORDER_HOLD_MINUTES * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Lấy trạng thái thanh toán đơn hàng (Client Polling)
   */
  static async getPaymentStatus(orderCode) {
    const order = await OrderRepository.findByOrderCode(orderCode);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng ${orderCode}`);
      err.statusCode = 404;
      throw err;
    }

    return {
      orderId: order.id,
      orderCode: order.order_code,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      isPaid: order.payment_status === PAYMENT_STATUS.PAID,
      status: order.status,
      totalAmount: Number(order.total_amount)
    };
  }

  /**
   * Hủy đơn hàng và hoàn lại tồn kho
   */
  static async cancelAndRestock(orderId, reason) {
    return OrderRepository.cancelAndRestockOrder(orderId, reason);
  }

  /**
   * Quét và hủy các đơn hàng SePay chờ thanh toán quá 15 phút
   */
  static async releaseExpiredReservations() {
    return OrderRepository.releaseExpiredOrders(ORDER_HOLD_MINUTES);
  }

  /**
   * Xác thực SePay Webhook Header
   */
  static authenticateSepayWebhook(headers) {
    const cfg = this.getSepayConfig();
    if (!cfg.apiKey) return true;
    const authHeader = headers['authorization'] || headers['Authorization'];
    const expectedWithPrefix = `Apikey ${cfg.apiKey}`;
    if (!authHeader || (authHeader !== expectedWithPrefix && authHeader !== cfg.apiKey)) {
      const err = new Error('Unauthorized SePay Webhook: API Key không hợp lệ hoặc bị thiếu.');
      err.statusCode = 401;
      throw err;
    }
    return true;
  }

  /**
   * Xử lý SePay Webhook (Phase 3.3.2 - Enterprise Grade)
   * - Xác thực API Key
   * - Kiểm tra Transaction ID & Tiền vào
   * - Đối chiếu đơn hàng chính xác
   * - Idempotency với Database UNIQUE Constraint
   * - Xử lý chuyển thiếu (PARTIALLY_PAID) / chuyển đúng / chuyển thừa
   * - Xử lý giao dịch đến muộn khi đơn đã bị hủy (LATE_PAYMENT)
   */
  static async handleSepayWebhook(headers, body) {
    // 1. Xác thực nguồn gửi
    this.authenticateSepayWebhook(headers);

    const { id, referenceCode, gateway, transferType, transferAmount, content } = body || {};

    // 2. Kiểm tra giao dịch tiền vào
    if (transferType && String(transferType).toLowerCase() !== 'in') {
      return {
        success: true,
        ignored: true,
        message: 'Bỏ qua giao dịch vì không phải tiền vào tài khoản (transferType != in)'
      };
    }

    // 3. Kiểm tra Transaction ID
    const rawTxId = referenceCode || id;
    if (!rawTxId) {
      const err = new Error('Thiếu thông tin định danh giao dịch SePay (id hoặc referenceCode)');
      err.statusCode = 400;
      throw err;
    }
    const transactionCode = String(referenceCode || `SEPAY-${id}`).trim();

    // 4. Kiểm tra Idempotency trước (nếu giao dịch đã được ghi nhận trước đó)
    const existingTx = await OrderRepository.findTransactionByCode(transactionCode);
    if (existingTx) {
      return {
        success: true,
        idempotent: true,
        duplicate: true,
        transactionCode,
        message: `Giao dịch ${transactionCode} đã được ghi nhận trước đó. Bỏ qua để bảo đảm Idempotency.`
      };
    }

    // 5. Kiểm tra nội dung chuyển khoản và tìm mã đơn
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const err = new Error('Nội dung chuyển khoản rỗng');
      err.statusCode = 400;
      throw err;
    }

    let matchedOrder = null;
    const match = content.match(/AUR-\d{8}-[A-Za-z0-9]+/i) || content.match(/AUR-\d{4}-\d+/i);
    if (match) {
      matchedOrder = await OrderRepository.findByOrderCode(match[0].toUpperCase());
    }

    if (!matchedOrder) {
      // Fallback quét các đơn đang chờ thanh toán gần nhất
      const pendingOrders = await query(`
        SELECT TOP 20 * FROM orders 
        WHERE payment_status IN ('UNPAID', 'PARTIALLY_PAID')
        ORDER BY created_at DESC
      `);
      for (const ord of pendingOrders.recordset) {
        if (content.toUpperCase().includes(ord.order_code.toUpperCase())) {
          matchedOrder = ord;
          break;
        }
      }
    }

    if (!matchedOrder) {
      return {
        success: false,
        notFound: true,
        message: 'Không tìm thấy đơn hàng khớp với nội dung chuyển khoản ngân hàng'
      };
    }

    // 6. Kiểm tra số tiền giao dịch
    const currentTransfer = Number(transferAmount);
    if (isNaN(currentTransfer) || currentTransfer <= 0) {
      const err = new Error('Số tiền chuyển khoản không hợp lệ');
      err.statusCode = 400;
      throw err;
    }

    // 7. Xử lý Giao Dịch Đến Muộn (Late Arrival) khi đơn đã bị hủy / hết hạn
    if (matchedOrder.status === ORDER_STATUS.CANCELLED) {
      // Đơn đã bị hủy (ví dụ hết hạn 15 phút tồn kho đã hoàn lại).
      // TUYỆT ĐỐI KHÔNG tự động chuyển CONFIRMED hay hồi sinh đơn vì kho đã hoàn!
      const recordResult = await OrderRepository.recordPaymentAndProcessOrder({
        orderId: matchedOrder.id,
        transactionCode,
        paymentMethod: PAYMENT_METHOD.SEPAY_QR,
        amount: currentTransfer,
        gatewayResponseCode: '00',
        txStatus: 'LATE_PAYMENT',
        newPaymentStatus: null, // Không đổi sang PAID tự động
        newOrderStatus: null    // Giữ nguyên CANCELLED
      });

      if (recordResult.duplicate) {
        return {
          success: true,
          idempotent: true,
          duplicate: true,
          transactionCode,
          message: `Giao dịch ${transactionCode} đã được ghi nhận trước đó.`
        };
      }

      return {
        success: true,
        latePayment: true,
        orderCode: matchedOrder.order_code,
        status: matchedOrder.status,
        message: `Đơn hàng ${matchedOrder.order_code} đã bị hủy trước đó do hết hạn 15 phút. Giao dịch đã được ghi nhận (LATE_PAYMENT) để bộ phận kế toán đối soát hoàn tiền cho khách.`
      };
    }

    // 8. Đơn đã được PAID trước đó
    if (matchedOrder.payment_status === PAYMENT_STATUS.PAID) {
      const recordResult = await OrderRepository.recordPaymentAndProcessOrder({
        orderId: matchedOrder.id,
        transactionCode,
        paymentMethod: PAYMENT_METHOD.SEPAY_QR,
        amount: currentTransfer,
        gatewayResponseCode: '00',
        txStatus: 'OVERPAYMENT_OR_EXTRA',
        newPaymentStatus: PAYMENT_STATUS.PAID,
        newOrderStatus: null
      });

      return {
        success: true,
        alreadyPaid: true,
        orderCode: matchedOrder.order_code,
        message: `Đơn hàng ${matchedOrder.order_code} đã được thanh toán hoàn tất trước đó. Giao dịch mới được ghi nhận bổ sung.`
      };
    }

    // 9. Tính tổng tiền đã trả và kiểm tra Chuyển thiếu / Chuyển đúng / Chuyển thừa
    const previousPaid = await OrderRepository.getPaidAmountForOrder(matchedOrder.id);
    const totalPaid = previousPaid + currentTransfer;
    const orderTotal = Number(matchedOrder.total_amount);

    let newPaymentStatus = PAYMENT_STATUS.UNPAID;
    let newOrderStatus = matchedOrder.status;
    let paymentDetail = {};

    if (totalPaid < orderTotal) {
      // CHUYỂN THIẾU
      newPaymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
      newOrderStatus = ORDER_STATUS.PENDING; // Giữ nguyên PENDING, không duyệt đơn
      paymentDetail = {
        type: 'UNDERPAID',
        missingAmount: orderTotal - totalPaid,
        totalPaid,
        orderTotal
      };
    } else if (totalPaid === orderTotal) {
      // CHUYỂN ĐÚNG
      newPaymentStatus = PAYMENT_STATUS.PAID;
      newOrderStatus = ORDER_STATUS.CONFIRMED;
      paymentDetail = {
        type: 'EXACT',
        totalPaid,
        orderTotal
      };
    } else {
      // CHUYỂN THỪA
      newPaymentStatus = PAYMENT_STATUS.PAID;
      newOrderStatus = ORDER_STATUS.CONFIRMED;
      const overpaidAmount = totalPaid - orderTotal;
      paymentDetail = {
        type: 'OVERPAID',
        overpaidAmount,
        totalPaid,
        orderTotal
      };
    }

    // 10. Ghi nhận giao dịch và cập nhật đơn hàng trong Transaction nguyên tử
    const recordResult = await OrderRepository.recordPaymentAndProcessOrder({
      orderId: matchedOrder.id,
      transactionCode,
      paymentMethod: PAYMENT_METHOD.SEPAY_QR,
      amount: currentTransfer,
      gatewayResponseCode: '00',
      txStatus: 'SUCCESS',
      newPaymentStatus,
      newOrderStatus
    });

    if (recordResult.duplicate) {
      return {
        success: true,
        idempotent: true,
        duplicate: true,
        transactionCode,
        message: `Giao dịch ${transactionCode} đã được ghi nhận trước đó (Idempotent).`
      };
    }

    return {
      success: true,
      orderCode: matchedOrder.order_code,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
      paymentDetail,
      message: newPaymentStatus === PAYMENT_STATUS.PAID
        ? `Đơn hàng ${matchedOrder.order_code} đã thanh toán thành công qua SePay (${paymentDetail.type === 'OVERPAID' ? 'Thừa ' + paymentDetail.overpaidAmount.toLocaleString('vi-VN') + ' đ' : 'Đủ tiền'})!`
        : `Đã ghi nhận thanh toán một phần cho đơn ${matchedOrder.order_code}. Còn thiếu ${paymentDetail.missingAmount.toLocaleString('vi-VN')} đ.`
    };
  }

  /**
   * Giả lập thanh toán SePay (Chỉ cho phép trong Development và có quyền Admin)
   */
  static async simulatePayment(orderCode) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('API Giả lập thanh toán bị vô hiệu hóa hoàn toàn trên môi trường Production.');
      err.statusCode = 403;
      throw err;
    }

    const order = await OrderRepository.findByOrderCode(orderCode);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng ${orderCode}`);
      err.statusCode = 404;
      throw err;
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      const err = new Error(`Đơn hàng ${orderCode} đã bị hủy, không thể kích hoạt thanh toán.`);
      err.statusCode = 400;
      throw err;
    }

    if (order.payment_status === PAYMENT_STATUS.PAID) {
      const err = new Error(`Đơn hàng ${orderCode} đã ở trạng thái ĐÃ THANH TOÁN trước đó.`);
      err.statusCode = 400;
      throw err;
    }

    const transCode = `SEPAY-SIM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await OrderRepository.recordPaymentAndProcessOrder({
      orderId: order.id,
      transactionCode: transCode,
      paymentMethod: PAYMENT_METHOD.SEPAY_QR,
      amount: Number(order.total_amount),
      gatewayResponseCode: '00',
      txStatus: 'SUCCESS',
      newPaymentStatus: PAYMENT_STATUS.PAID,
      newOrderStatus: ORDER_STATUS.CONFIRMED
    });

    return {
      orderCode: order.order_code,
      paymentStatus: PAYMENT_STATUS.PAID,
      status: ORDER_STATUS.CONFIRMED,
      transactionCode: transCode
    };
  }

  /**
   * Lấy danh sách đơn hàng của khách hàng hiện tại (my-orders)
   */
  static async getMyOrders(userId, { page = 1, limit = 20 } = {}) {
    if (!userId) {
      const err = new Error('Yêu cầu đăng nhập để xem danh sách đơn hàng.');
      err.statusCode = 401;
      throw err;
    }
    return OrderRepository.findOrdersByUserId(userId, { page, limit });
  }

  /**
   * Lấy chi tiết đơn hàng (có kiểm tra quyền sở hữu IDOR)
   */
  static async getOrderDetails(orderId, user = null, phoneVerification = null) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền sở hữu
    if (user) {
      const isOwner = order.user_id && Number(order.user_id) === Number(user.id);
      const isAdmin = user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        const err = new Error('Bạn không có quyền truy cập thông tin đơn hàng này.');
        err.statusCode = 403;
        throw err;
      }
    } else {
      // Khách vãng lai: bắt buộc khớp số điện thoại
      if (!phoneVerification || String(order.phone_number).trim() !== String(phoneVerification).trim()) {
        const err = new Error('Vui lòng cung cấp số điện thoại đặt hàng để xác minh danh tính.');
        err.statusCode = 401;
        throw err;
      }
    }

    const items = await OrderRepository.getOrderItems(order.id);
    return {
      id: order.id,
      orderCode: order.order_code,
      totalAmount: Number(order.total_amount),
      discountAmount: Number(order.discount_amount || 0),
      shippingFee: Number(order.shipping_fee || 0),
      shippingAddress: order.shipping_address,
      phoneNumber: order.phone_number,
      customerName: order.customer_name || 'Khách Vãng Lai',
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      trackingCode: order.tracking_code,
      status: order.status,
      createdAt: order.created_at,
      items: items.map(it => ({
        id: it.id,
        variantId: it.variant_id,
        productId: it.product_id,
        productName: it.product_name,
        size: it.size,
        color: it.color,
        sku: it.sku,
        quantity: it.quantity,
        price: Number(it.price),
        subtotal: Number(it.price) * it.quantity
      }))
    };
  }

  /**
   * Tra cứu đơn hàng an toàn (Track order có bảo vệ dữ liệu cá nhân)
   */
  static async trackOrder(code, phoneVerification = null, user = null) {
    const order = await OrderRepository.findByOrderCode(code);
    if (!order) {
      const err = new Error(`Không tìm thấy mã đơn hàng ${code}`);
      err.statusCode = 404;
      throw err;
    }

    const items = await OrderRepository.getOrderItems(order.id);

    // Kiểm tra xác minh số điện thoại
    const isOwner = Boolean(user && (user.role === 'ADMIN' || (order.user_id && Number(order.user_id) === Number(user.id))));
    const isPhoneVerified = isOwner || Boolean(phoneVerification && String(order.phone_number).trim() === String(phoneVerification).trim());

    // Masking dữ liệu cá nhân nếu chưa xác minh số điện thoại
    const maskedPhone = isPhoneVerified 
      ? order.phone_number 
      : (order.phone_number ? String(order.phone_number).slice(0, 3) + '****' + String(order.phone_number).slice(-3) : null);
    
    const maskedAddress = isPhoneVerified
      ? order.shipping_address
      : (order.shipping_address?.includes(',') ? order.shipping_address.split(',').slice(-2).join(', ').trim() : 'Cần xác minh số điện thoại');

    return {
      orderCode: order.order_code,
      userId: isOwner ? order.user_id : null,
      customerName: isPhoneVerified ? order.customer_name : null,
      totalAmount: Number(order.total_amount),
      status: order.status,
      statusText: order.status === ORDER_STATUS.SHIPPED 
        ? 'Đang giao hàng hỏa tốc' 
        : (order.status === ORDER_STATUS.COMPLETED ? 'Giao hàng thành công' : (order.status === ORDER_STATUS.CANCELLED ? 'Đã hủy' : (order.status === ORDER_STATUS.CONFIRMED ? 'Đã xác nhận' : 'Chờ xử lý'))),
      trackingCode: order.tracking_code || null,
      carrier: null,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      shippingAddress: maskedAddress,
      phoneNumber: maskedPhone,
      isFullyVerified: isPhoneVerified,
      items: items.map(it => ({
        name: it.product_name,
        size: it.size,
        color: it.color,
        quantity: it.quantity,
        price: Number(it.price)
      }))
    };
  }

  /**
   * Khách hàng / Admin yêu cầu hủy đơn hàng (có kiểm tra quyền sở hữu và luồng trạng thái)
   */
  static async cancelOrderWithOwnership(orderId, user = null, reason = 'Khách hàng yêu cầu hủy đơn') {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra quyền sở hữu
    if (user) {
      const isOwner = order.user_id && Number(order.user_id) === Number(user.id);
      const isAdmin = user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        const err = new Error('Bạn không có quyền hủy đơn hàng này.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Kiểm tra tính hợp lệ: Chỉ được hủy đơn khi đang PENDING hoặc CONFIRMED
    if ([ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED].includes(order.status)) {
      const err = new Error(`Đơn hàng đang ở trạng thái "${order.status}", không thể tự hủy qua hệ thống. Vui lòng liên hệ Hotline VIP 1800-AURALIE.`);
      err.statusCode = 400;
      throw err;
    }

    return OrderRepository.cancelAndRestockOrder(order.id, reason);
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin State Machine Guard)
   */
  static async updateOrderStatus(id, newStatus) {
    const order = await OrderRepository.findById(id);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${id}`);
      err.statusCode = 404;
      throw err;
    }

    // Kích hoạt Guard State Machine
    OrderStateMachine.validateTransition(order.status, newStatus, order);

    // Nếu chuyển sang CANCELLED thì thực hiện hoàn kho
    if (newStatus === ORDER_STATUS.CANCELLED) {
      return OrderRepository.cancelAndRestockOrder(id, 'Admin hủy đơn hàng');
    }

    return OrderRepository.updateStatus(id, newStatus);
  }

  /**
   * Lấy danh sách đơn hàng Admin (Phân trang và bộ lọc chuyên nghiệp)
   */
  static async getAdminOrders(params) {
    return OrderRepository.getAdminOrders(params);
  }

  /**
   * Lấy tất cả đơn hàng (Admin backward compatible)
   */
  static async getAllOrders() {
    return OrderRepository.getAllOrders();
  }

  /**
   * Lấy danh sách lịch sử giao dịch (Admin)
   */
  static async getPaymentTransactions(params) {
    return OrderRepository.getAllPaymentTransactions(params);
  }
}

module.exports = OrderService;
