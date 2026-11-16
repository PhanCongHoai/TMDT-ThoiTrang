const { poolPromise, query } = require('../../config/db');
const sql = require('mssql');
const OrderRepository = require('../orders/orders.repository');
const { OrderStateMachine } = require('../orders/orders.state-machine');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('../orders/orders.constants');
const OrderService = require('../orders/orders.service');
const logger = require('../../utils/logger');

class ShipperService {
  /**
   * Lấy danh sách đơn hàng cho Shipper Portal với bộ lọc và danh sách sản phẩm
   */
  static async getShipperOrders({ tab = 'all', search = '' } = {}) {
    const pool = await poolPromise;
    const req = pool.request();
    const whereClauses = ['1=1'];

    if (tab === 'ready') {
      whereClauses.push(`o.status IN ('CONFIRMED', 'PROCESSING')`);
    } else if (tab === 'shipping') {
      whereClauses.push(`o.status = 'SHIPPED'`);
    } else if (tab === 'completed') {
      whereClauses.push(`o.status = 'COMPLETED'`);
    } else if (tab === 'failed') {
      whereClauses.push(`o.status = 'CANCELLED'`);
    }

    if (search && search.trim()) {
      whereClauses.push(`(o.order_code LIKE @search OR o.tracking_code LIKE @search OR o.phone_number LIKE @search OR u.full_name LIKE @search OR o.shipping_address LIKE @search)`);
      req.input('search', sql.NVarChar(100), `%${search.trim()}%`);
    }

    const whereSql = whereClauses.join(' AND ');
    const queryStr = `
      SELECT o.*, 
             COALESCE(u.full_name, N'Khách Hàng Thượng Khách') AS customer_name,
             COALESCE(u.phone, o.phone_number) AS customer_phone,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereSql}
      ORDER BY 
        CASE 
          WHEN o.status = 'SHIPPED' THEN 1
          WHEN o.status IN ('CONFIRMED', 'PROCESSING') THEN 2
          WHEN o.status = 'COMPLETED' THEN 3
          ELSE 4
        END,
        o.created_at DESC
    `;

    const ordersRes = await req.query(queryStr);
    const orders = ordersRes.recordset;

    // Lấy items cho từng order
    const enhancedOrders = await Promise.all(orders.map(async (o) => {
      const items = await OrderRepository.getOrderItems(o.id);
      
      // Tính toán khoảng cách & ETA mô phỏng dựa theo id
      const baseDist = ((o.id * 7) % 85 + 15) / 10; // 1.5km - 10km
      const distanceKm = Number(baseDist.toFixed(1));
      const estMinutes = Math.max(8, Math.round(distanceKm * 4));

      return {
        id: o.id,
        orderCode: o.order_code,
        trackingCode: o.tracking_code || `GHN-VN-${o.id}8868`,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        totalAmount: Number(o.total_amount),
        shippingFee: Number(o.shipping_fee || 0),
        shippingAddress: o.shipping_address || 'Địa chỉ tiêu chuẩn AURALIÈ',
        phoneNumber: o.phone_number || '0901234567',
        customerName: o.customer_name,
        createdAt: o.created_at,
        distanceKm,
        estimatedTime: `${estMinutes} phút`,
        isCod: o.payment_method === PAYMENT_METHOD.COD,
        codAmount: o.payment_method === PAYMENT_METHOD.COD && o.payment_status !== PAYMENT_STATUS.PAID ? Number(o.total_amount) : 0,
        itemsCount: o.items_count,
        items: items.map(item => ({
          name: item.product_name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      };
    }));

    return enhancedOrders;
  }

  /**
   * Thống kê KPI cho tài xế giao hàng
   */
  static async getShipperStats() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
      SELECT 
        COUNT(CASE WHEN status IN ('CONFIRMED', 'PROCESSING') THEN 1 END) AS ready_count,
        COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) AS shipping_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_count,
        ISNULL(SUM(CASE WHEN status = 'COMPLETED' AND payment_method = 'COD' THEN total_amount ELSE 0 END), 0) AS cod_collected
      FROM orders
    `);

    const stats = res.recordset[0] || {};
    return {
      readyCount: Number(stats.ready_count || 0),
      shippingCount: Number(stats.shipping_count || 0),
      completedCount: Number(stats.completed_count || 0),
      codCollected: Number(stats.cod_collected || 0),
      driver: {
        id: 'SHP-8821',
        name: 'Nguyễn Văn Hùng',
        phone: '0988.668.888',
        vehicle: 'Yamaha Grande VIP • 59-X1 888.68',
        rating: 4.98,
        ratingCount: 1420,
        shift: 'Ca Ngày (07:00 - 19:00)',
        zone: 'Khu vực Trung Tâm & Ngoại Ô TP.HCM',
        status: 'ONLINE'
      }
    };
  }

  /**
   * Tài xế nhận đơn lấy hàng tại kho -> Chuyển sang SHIPPED (Đang giao hàng)
   */
  static async pickupOrder(orderId) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    if (order.status === ORDER_STATUS.SHIPPED) {
      return {
        success: true,
        message: `Đơn hàng #${order.order_code} đã ở trạng thái Đang Giao trước đó.`,
        order
      };
    }

    // Kiểm tra state machine
    OrderStateMachine.validateTransition(order.status, ORDER_STATUS.SHIPPED, order);

    await OrderRepository.updateStatus(orderId, ORDER_STATUS.SHIPPED);

    logger.info(`[Shipper] Tài xế đã nhận đơn #${order.order_code} (ID: ${orderId}) đi giao hàng.`);

    return {
      success: true,
      message: `Đã nhận đơn hàng #${order.order_code}! Bắt đầu lộ trình giao hàng đến khách.`,
      orderId,
      orderCode: order.order_code,
      status: ORDER_STATUS.SHIPPED
    };
  }

  /**
   * Tài xế xác nhận giao hàng thành công -> COMPLETED
   * Nếu đơn là COD -> Tự động cập nhật payment_status = PAID & Ghi sổ payment_transactions
   */
  static async deliverOrder(orderId, { proofPhoto = '', signature = '', note = '' } = {}) {
    const pool = await poolPromise;
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      return {
        success: true,
        message: `Đơn hàng #${order.order_code} đã hoàn tất giao hàng trước đó.`,
        order
      };
    }

    // Nếu đơn chưa ở SHIPPED (ví dụ đang CONFIRMED/PROCESSING), tự động hợp lệ hóa sang SHIPPED rồi COMPLETED
    if (order.status !== ORDER_STATUS.SHIPPED) {
      OrderStateMachine.validateTransition(order.status, ORDER_STATUS.SHIPPED, order);
      await OrderRepository.updateStatus(orderId, ORDER_STATUS.SHIPPED);
    }

    // Validate SHIPPED -> COMPLETED
    OrderStateMachine.validateTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED, order);

    const isCod = order.payment_method === PAYMENT_METHOD.COD;
    const now = new Date();

    if (isCod) {
      // Cập nhật status = COMPLETED & payment_status = PAID
      await query(`
        UPDATE orders 
        SET status = @status, payment_status = @paymentStatus 
        WHERE id = @id
      `, {
        id: orderId,
        status: ORDER_STATUS.COMPLETED,
        paymentStatus: PAYMENT_STATUS.PAID
      });

      // Ghi nhận giao dịch thu tiền mặt COD
      const transCode = `COD-DELIVERY-${order.id}-${Date.now()}`;
      await query(`
        INSERT INTO payment_transactions (order_id, transaction_code, payment_method, amount, gateway_response_code, status, paid_at)
        VALUES (@orderId, @transCode, 'COD', @amount, '00', 'SUCCESS', @paidAt)
      `, {
        orderId: order.id,
        transCode,
        amount: Number(order.total_amount),
        paidAt: now
      });
    } else {
      // Đơn online đã thanh toán trước
      await query(`
        UPDATE orders 
        SET status = @status 
        WHERE id = @id
      `, {
        id: orderId,
        status: ORDER_STATUS.COMPLETED
      });
    }

    // Ghi nhận sự kiện Purchase Tracking để đồng bộ Machine Learning & Analytics
    try {
      const items = await OrderRepository.getOrderItems(order.id);
      await OrderService.recordPurchaseEvent({
        orderId: order.id,
        orderCode: order.order_code,
        userId: order.user_id || null,
        totalAmount: Number(order.total_amount || 0),
        paymentMethod: order.payment_method,
        items
      });
    } catch (trackErr) {
      logger.warn(`[Shipper Deliver] Không thể ghi nhận purchase tracking: ${trackErr.message}`);
    }

    logger.info(`[Shipper] Giao thành công đơn #${order.order_code}! COD: ${isCod ? order.total_amount : 0} VNĐ.`);

    return {
      success: true,
      message: `Giao hàng thành công đơn #${order.order_code}! ${isCod ? `Đã thu tiền mặt COD: ${Number(order.total_amount).toLocaleString('vi-VN')} ₫.` : 'Đơn hàng trả trước thành công.'}`,
      orderId,
      orderCode: order.order_code,
      status: ORDER_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.PAID,
      deliveredAt: now.toISOString(),
      proofPhoto: proofPhoto || 'assets/proof-delivery-default.jpg',
      note: note || 'Khách hàng nhận bọc bảo quản Haute Couture đầy đủ phụ kiện.'
    };
  }

  /**
   * Báo sự cố giao hàng / Khách từ chối nhận hàng
   */
  static async reportDeliveryFailure(orderId, { reason = 'Khách không nghe máy', action = 'reschedule' } = {}) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const err = new Error(`Không tìm thấy đơn hàng #${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    if (action === 'cancel' || reason.includes('từ chối') || reason.includes('hủy')) {
      // Khách kiên quyết từ chối nhận -> Hủy đơn và hoàn tồn kho
      await OrderRepository.cancelAndRestockOrder(orderId, `Shipper báo hủy: ${reason}`);
      return {
        success: true,
        message: `Đã hủy đơn #${order.order_code} và kích hoạt thủ tục hoàn hàng nhập kho. Lý do: ${reason}`,
        orderId,
        status: ORDER_STATUS.CANCELLED
      };
    }

    // Hẹn lại: Giữ nguyên trạng thái SHIPPED, chỉ ghi log shipper
    logger.info(`[Shipper] Hẹn giao lại đơn #${order.order_code}. Lý do: ${reason}`);
    return {
      success: true,
      message: `Đã ghi nhận báo cáo hẹn lại lịch giao cho đơn #${order.order_code}. Trạng thái đơn vẫn là Đang Giao. Lý do: ${reason}`,
      orderId,
      status: order.status,
      reason
    };
  }

  /**
   * Tạo nhanh một đơn hàng mô phỏng để Shipper trải nghiệm ngay lập tức
   */
  static async createSimulatedOrder() {
    const pool = await poolPromise;
    // Tìm một variant có sẵn
    const variantRes = await pool.request().query(`
      SELECT TOP 1 pv.id AS variant_id, pv.product_id, pv.size, pv.color, pv.sku, p.name AS product_name, COALESCE(pv.variant_price, p.base_price) AS price
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock_quantity > 5
    `);

    const variant = variantRes.recordset[0];
    if (!variant) {
      throw new Error('Không còn sản phẩm nào trong kho để tạo đơn thử nghiệm.');
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderCode = `AUR-${dateStr}-${randSuffix}`;
    const trackingCode = `GHN-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const totalAmount = Number(variant.price);

    const addresses = [
      'Số 28 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      'Căn hộ Penthouse 42-B, Tháp Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM',
      'Biệt thự Chateau R2-18, Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh',
      'Tòa nhà Deutsches Haus, 33 Lê Duẩn, Quận 1, TP. Hồ Chí Minh'
    ];
    const chosenAddress = addresses[Math.floor(Math.random() * addresses.length)];

    const customers = [
      { name: 'Nguyễn Thanh Vân (VIP)', phone: '0903333444' },
      { name: 'Trần Gia Bảo (VIP)', phone: '0912444555' },
      { name: 'Lê Hoàng Yến', phone: '0987654321' }
    ];
    const chosenCustomer = customers[Math.floor(Math.random() * customers.length)];

    // Insert order
    const insertRes = await pool.request()
      .input('orderCode', sql.NVarChar(50), orderCode)
      .input('totalAmount', sql.Decimal(12, 2), totalAmount)
      .input('shippingFee', sql.Decimal(10, 2), 0)
      .input('shippingAddress', sql.NVarChar(500), chosenAddress)
      .input('phoneNumber', sql.NVarChar(20), chosenCustomer.phone)
      .input('paymentMethod', sql.NVarChar(30), PAYMENT_METHOD.COD)
      .input('paymentStatus', sql.NVarChar(30), PAYMENT_STATUS.UNPAID)
      .input('trackingCode', sql.NVarChar(50), trackingCode)
      .input('status', sql.NVarChar(30), ORDER_STATUS.CONFIRMED)
      .query(`
        INSERT INTO orders (
          user_id, order_code, total_amount, discount_amount, shipping_fee,
          shipping_address, phone_number, payment_method, payment_status,
          tracking_code, status, created_at
        )
        OUTPUT INSERTED.id
        VALUES (
          2, @orderCode, @totalAmount, 0, @shippingFee,
          @shippingAddress, @phoneNumber, @paymentMethod, @paymentStatus,
          @trackingCode, @status, GETDATE()
        )
      `);

    const orderId = insertRes.recordset[0].id;

    // Insert item
    await pool.request()
      .input('orderId', sql.Int, orderId)
      .input('variantId', sql.Int, variant.variant_id)
      .input('price', sql.Decimal(12, 2), totalAmount)
      .input('quantity', sql.Int, 1)
      .query(`
        INSERT INTO order_items (order_id, variant_id, price, quantity)
        VALUES (@orderId, @variantId, @price, @quantity)
      `);

    logger.info(`[Shipper Simulation] Đã tạo thành công đơn hàng giả lập mới #${orderCode} (ID: ${orderId}).`);

    return {
      orderId,
      orderCode,
      trackingCode,
      totalAmount,
      shippingAddress: chosenAddress,
      customerName: chosenCustomer.name,
      phoneNumber: chosenCustomer.phone,
      paymentMethod: 'COD',
      status: ORDER_STATUS.CONFIRMED
    };
  }
}

module.exports = ShipperService;
