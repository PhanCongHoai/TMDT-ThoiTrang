const { sql, poolPromise, query } = require('../../config/db');

/**
 * OrderRepository - Tầng tương tác CSDL cho Đơn hàng & Tồn kho
 * Áp dụng Strict SQL Parameterization và Atomic SQL Transactions
 */
class OrderRepository {
  /**
   * Tra cứu thông tin sản phẩm và biến thể từ DB (để lấy giá gốc và kiểm tra tồn kho)
   */
  static async resolveItemDetails(item) {
    const pool = await poolPromise;
    const variantId = item.variantId || item.variant_id;
    const rawId = item.productId !== undefined ? item.productId : item.id;
    const size = item.size ? String(item.size).trim() : null;
    const color = item.color ? String(item.color).trim() : null;

    // 1. Tìm chính xác qua variantId
    if (variantId && !isNaN(Number(variantId))) {
      const res = await pool.request()
        .input('variantId', sql.Int, Number(variantId))
        .query(`
          SELECT 
            pv.id AS variant_id,
            pv.product_id,
            pv.size,
            pv.color,
            pv.stock_quantity,
            pv.variant_price,
            pv.sku,
            p.name AS product_name,
            p.base_price,
            p.is_active AS product_active
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.id = @variantId
        `);
      if (res.recordset.length > 0) return res.recordset[0];
    }

    // 2. Tìm qua productId dạng số
    if (rawId && !isNaN(Number(rawId))) {
      const numProductId = Number(rawId);
      // Ưu tiên khớp size & color
      const req = pool.request()
        .input('productId', sql.Int, numProductId)
        .input('size', sql.NVarChar(20), size)
        .input('color', sql.NVarChar(100), color);

      const res = await req.query(`
        SELECT TOP 1
          pv.id AS variant_id,
          pv.product_id,
          pv.size,
          pv.color,
          pv.stock_quantity,
          pv.variant_price,
          pv.sku,
          p.name AS product_name,
          p.base_price,
          p.is_active AS product_active
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.product_id = @productId
          AND (@size IS NULL OR pv.size = @size)
        ORDER BY 
          CASE WHEN @color IS NOT NULL AND pv.color LIKE '%' + @color + '%' THEN 1 ELSE 2 END,
          pv.id ASC
      `);

      if (res.recordset.length > 0) return res.recordset[0];

      // Nếu sản phẩm không có biến thể, lấy trực tiếp từ products
      const pRes = await pool.request()
        .input('productId', sql.Int, numProductId)
        .query(`
          SELECT 
            NULL AS variant_id,
            id AS product_id,
            'Standard' AS size,
            'Default' AS color,
            999 AS stock_quantity,
            base_price AS variant_price,
            NULL AS sku,
            name AS product_name,
            base_price,
            is_active AS product_active
          FROM products
          WHERE id = @productId
        `);
      if (pRes.recordset.length > 0) return pRes.recordset[0];
    }

    // 3. Tìm qua slug / name nếu id là string (ví dụ prod-...)
    if (typeof rawId === 'string' && isNaN(Number(rawId))) {
      const cleanSlug = rawId.replace(/^prod-/, '');
      const req = pool.request()
        .input('slug', sql.NVarChar(200), cleanSlug)
        .input('name', sql.NVarChar(200), item.name || cleanSlug);

      const res = await req.query(`
        SELECT TOP 1
          pv.id AS variant_id,
          pv.product_id,
          pv.size,
          pv.color,
          pv.stock_quantity,
          pv.variant_price,
          pv.sku,
          p.name AS product_name,
          p.base_price,
          p.is_active AS product_active
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.slug = @slug OR p.name LIKE '%' + @name + '%'
        ORDER BY pv.id ASC
      `);
      if (res.recordset.length > 0) return res.recordset[0];
    }

    return null;
  }

  /**
   * Tra cứu thông tin mã giảm giá
   */
  static async findCouponByCode(code) {
    if (!code) return null;
    const res = await query(`
      SELECT * FROM coupons 
      WHERE code = @code AND is_active = 1
    `, { code: String(code).trim().toUpperCase() });
    return res.recordset[0] || null;
  }

  /**
   * Helper Rollback an toàn:
   * - Không phụ thuộc thuộc tính private (transaction._aborted)
   * - Bắt và ghi log cảnh báo an toàn nếu rollback thất bại do kết nối đã ngắt/đã đóng
   * - Tuyệt đối không che giấu lỗi database gốc
   */
  static async safeRollback(transaction, contextMsg = '') {
    if (!transaction) return;
    try {
      await transaction.rollback();
    } catch (rbErr) {
      console.warn(`[DB Transaction Warning] Rollback ${contextMsg ? `(${contextMsg}): ` : ''}${rbErr.message}`);
    }
  }

  /**
   * Tạo Đơn Hàng & Giữ Tồn Kho Nguyên Tử (Atomic SQL Transaction)
   */
  static async createOrderWithReservation({ orderData, items, couponId }) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // 1. Thêm bản ghi orders
      const orderReq = new sql.Request(transaction);
      orderReq.input('userId', sql.Int, orderData.userId || null);
      orderReq.input('orderCode', sql.NVarChar(50), orderData.orderCode);
      orderReq.input('totalAmount', sql.Decimal(18, 2), orderData.totalAmount);
      orderReq.input('discountAmount', sql.Decimal(18, 2), orderData.discountAmount || 0);
      orderReq.input('shippingFee', sql.Decimal(18, 2), orderData.shippingFee || 0);
      orderReq.input('shippingAddress', sql.NVarChar(sql.MAX), orderData.shippingAddress);
      orderReq.input('phoneNumber', sql.NVarChar(20), orderData.phoneNumber);
      orderReq.input('paymentMethod', sql.NVarChar(30), orderData.paymentMethod);
      orderReq.input('paymentStatus', sql.NVarChar(30), orderData.paymentStatus);
      orderReq.input('trackingCode', sql.NVarChar(50), orderData.trackingCode);
      orderReq.input('status', sql.NVarChar(30), orderData.status);

      const orderInsertRes = await orderReq.query(`
        INSERT INTO orders (
          user_id, order_code, total_amount, discount_amount, shipping_fee,
          shipping_address, phone_number, payment_method, payment_status,
          tracking_code, status, created_at
        )
        OUTPUT INSERTED.id
        VALUES (
          @userId, @orderCode, @totalAmount, @discountAmount, @shippingFee,
          @shippingAddress, @phoneNumber, @paymentMethod, @paymentStatus,
          @trackingCode, @status, SYSDATETIME()
        )
      `);

      const orderId = orderInsertRes.recordset[0].id;

      // 2. Trừ tồn kho nguyên tử & thêm order_items
      for (const item of items) {
        if (item.variant_id) {
          const stockReq = new sql.Request(transaction);
          stockReq.input('variantId', sql.Int, item.variant_id);
          stockReq.input('quantity', sql.Int, item.quantity);

          // UPDLOCK & ROWLOCK để tránh Deadlock và Race condition
          const stockRes = await stockReq.query(`
            UPDATE product_variants WITH (UPDLOCK, ROWLOCK)
            SET stock_quantity = stock_quantity - @quantity
            WHERE id = @variantId AND stock_quantity >= @quantity
          `);

          if (stockRes.rowsAffected[0] === 0) {
            throw new Error(`Sản phẩm "${item.product_name}" (Biến thể: ${item.size} / ${item.color}) hiện không đủ tồn kho để đặt hàng.`);
          }
        }

        const itemReq = new sql.Request(transaction);
        itemReq.input('orderId', sql.Int, orderId);
        itemReq.input('variantId', sql.Int, item.variant_id || null);
        itemReq.input('quantity', sql.Int, item.quantity);
        itemReq.input('price', sql.Decimal(18, 2), item.price);
        itemReq.input('productName', sql.NVarChar(200), item.product_name || null);
        itemReq.input('sku', sql.NVarChar(50), item.sku || null);
        itemReq.input('size', sql.NVarChar(20), item.size || null);
        itemReq.input('color', sql.NVarChar(100), item.color || null);

        await itemReq.query(`
          INSERT INTO order_items (order_id, variant_id, quantity, price, product_name, sku, size, color)
          VALUES (@orderId, @variantId, @quantity, @price, @productName, @sku, @size, @color)
        `);
      }

      // 3. Tăng số lần sử dụng coupon nguyên tử (chống vượt giới hạn khi có nhiều request đồng thời)
      if (couponId) {
        const cpReq = new sql.Request(transaction);
        cpReq.input('couponId', sql.Int, couponId);
        const cpRes = await cpReq.query(`
          UPDATE coupons WITH (UPDLOCK, ROWLOCK)
          SET used_count = ISNULL(used_count, 0) + 1 
          WHERE id = @couponId AND (usage_limit IS NULL OR ISNULL(used_count, 0) < usage_limit)
        `);

        if (cpRes.rowsAffected[0] === 0) {
          throw new Error('Mã ưu đãi đã hết lượt sử dụng trong khi bạn đang đặt hàng.');
        }
      }

      await transaction.commit();
      return orderId;
    } catch (err) {
      await OrderRepository.safeRollback(transaction, 'createOrderWithReservation');
      throw err;
    }
  }

  /**
   * Hủy đơn hàng và Hoàn lại tồn kho (Chống hoàn kho trùng lặp)
   */
  static async cancelAndRestockOrder(orderId, reason = 'Khách hủy hoặc hết hạn thanh toán') {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // 1. Kiểm tra trạng thái hiện tại (chỉ hoàn kho nếu đơn đang PENDING hoặc CONFIRMED)
      const checkReq = new sql.Request(transaction);
      checkReq.input('orderId', sql.Int, orderId);
      const checkRes = await checkReq.query(`
        SELECT id, status, payment_status, order_code
        FROM orders WITH (UPDLOCK, ROWLOCK)
        WHERE id = @orderId
      `);

      if (checkRes.recordset.length === 0) {
        throw new Error(`Không tìm thấy đơn hàng #${orderId}`);
      }

      const order = checkRes.recordset[0];
      if (order.status === 'CANCELLED') {
        // Đã hủy trước đó rồi, không hoàn kho thêm lần nào nữa
        await OrderRepository.safeRollback(transaction, 'cancelAndRestockOrder: already cancelled');
        return { alreadyCancelled: true, orderCode: order.order_code };
      }

      // Nếu đơn đã được thanh toán thành công qua Webhook, ngăn job hết hạn tự động hủy đơn
      if (order.payment_status === 'PAID' && reason && (reason.includes('Hết hạn') || reason.includes('hết hạn'))) {
        await OrderRepository.safeRollback(transaction, 'cancelAndRestockOrder: paid order');
        return { skippedDueToPayment: true, orderCode: order.order_code };
      }

      if (order.status === 'COMPLETED' || order.status === 'SHIPPED') {
        throw new Error(`Đơn hàng ${order.order_code} đã ở trạng thái ${order.status}, không thể tự động hủy hoàn kho.`);
      }

      // 2. Đổi trạng thái sang CANCELLED
      const cancelReq = new sql.Request(transaction);
      cancelReq.input('orderId', sql.Int, orderId);
      await cancelReq.query(`
        UPDATE orders 
        SET status = 'CANCELLED' 
        WHERE id = @orderId
      `);

      // 3. Lấy danh sách item để cộng lại kho
      const itemsReq = new sql.Request(transaction);
      itemsReq.input('orderId', sql.Int, orderId);
      const itemsRes = await itemsReq.query(`
        SELECT variant_id, quantity 
        FROM order_items 
        WHERE order_id = @orderId AND variant_id IS NOT NULL
      `);

      for (const it of itemsRes.recordset) {
        const restockReq = new sql.Request(transaction);
        restockReq.input('variantId', sql.Int, it.variant_id);
        restockReq.input('qty', sql.Int, it.quantity);
        await restockReq.query(`
          UPDATE product_variants 
          SET stock_quantity = stock_quantity + @qty 
          WHERE id = @variantId
        `);
      }

      await transaction.commit();
      return { success: true, orderCode: order.order_code };
    } catch (err) {
      await OrderRepository.safeRollback(transaction, 'cancelAndRestockOrder');
      throw err;
    }
  }

  /**
   * Quét và hủy các đơn hàng chờ SePay hết hạn 15 phút (TTL)
   * Bao gồm cả đơn hàng chưa thanh toán (UNPAID) và chưa thanh toán đủ (PARTIALLY_PAID)
   */
  static async releaseExpiredOrders(ttlMinutes = 15) {
    const expiredOrders = await query(`
      SELECT id, order_code, created_at
      FROM orders WITH (UPDLOCK, READPAST)
      WHERE payment_method = 'SEPAY_QR'
        AND payment_status IN ('UNPAID', 'PARTIALLY_PAID')
        AND status = 'PENDING'
        AND created_at < DATEADD(minute, -@ttlMinutes, SYSDATETIME())
    `, { ttlMinutes });

    const results = [];
    for (const ord of expiredOrders.recordset) {
      try {
        const res = await this.cancelAndRestockOrder(ord.id, `Hết hạn thanh toán ${ttlMinutes} phút`);
        results.push({ id: ord.id, orderCode: ord.order_code, success: res.success });
      } catch (err) {
        console.error(`[OrderRepository] Lỗi hoàn kho đơn hết hạn #${ord.id}:`, err.message);
      }
    }
    return results;
  }

  /**
   * Lấy chi tiết đơn hàng theo ID
   */
  static async findById(orderId) {
    const res = await query(`
      SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = @orderId
    `, { orderId: Number(orderId) });
    return res.recordset[0] || null;
  }

  /**
   * Lấy danh sách đơn hàng của khách hàng theo userId (có phân trang)
   */
  static async findOrdersByUserId(userId, { page = 1, limit = 20 } = {}) {
    const pool = await poolPromise;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countRes = await pool.request()
      .input('userId', sql.Int, Number(userId))
      .query('SELECT COUNT(*) AS total FROM orders WHERE user_id = @userId');
    const total = countRes.recordset[0].total;

    const dataRes = await pool.request()
      .input('userId', sql.Int, Number(userId))
      .input('offset', sql.Int, offset)
      .input('limitNum', sql.Int, limitNum)
      .query(`
        SELECT o.*,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
        FROM orders o
        WHERE o.user_id = @userId
        ORDER BY o.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limitNum ROWS ONLY
      `);

    return {
      items: dataRes.recordset,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Lấy đơn hàng theo mã order_code
   */
  static async findByOrderCode(orderCode) {
    const res = await query(`
      SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.order_code = @orderCode
    `, { orderCode: String(orderCode).trim().toUpperCase() });
    return res.recordset[0] || null;
  }

  /**
   * Lấy chi tiết các items của đơn hàng
   */
  static async getOrderItems(orderId) {
    const res = await query(`
      SELECT 
        oi.id,
        oi.order_id,
        oi.variant_id,
        pv.product_id,
        oi.quantity,
        oi.price,
        COALESCE(oi.size, pv.size) AS size,
        COALESCE(oi.color, pv.color) AS color,
        COALESCE(oi.sku, pv.sku) AS sku,
        COALESCE(oi.product_name, p.name) AS product_name
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = @orderId
    `, { orderId });
    return res.recordset;
  }

  /**
   * Lấy danh sách đơn hàng cho Admin với tìm kiếm, bộ lọc và phân trang chuyên nghiệp
   */
  static async getAdminOrders({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    paymentStatus = '',
    startDate = '',
    endDate = ''
  } = {}) {
    const pool = await poolPromise;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = ['1=1'];
    const req = pool.request();

    if (search && search.trim()) {
      whereClauses.push('(o.order_code LIKE @search OR o.phone_number LIKE @search OR u.full_name LIKE @search OR o.shipping_address LIKE @search)');
      req.input('search', sql.NVarChar(100), `%${search.trim()}%`);
    }

    if (status && status.trim()) {
      whereClauses.push('o.status = @status');
      req.input('status', sql.NVarChar(30), status.trim());
    }

    if (paymentStatus && paymentStatus.trim()) {
      whereClauses.push('o.payment_status = @paymentStatus');
      req.input('paymentStatus', sql.NVarChar(30), paymentStatus.trim());
    }

    if (startDate && startDate.trim()) {
      whereClauses.push('o.created_at >= @startDate');
      req.input('startDate', sql.DateTime2, new Date(startDate));
    }

    if (endDate && endDate.trim()) {
      whereClauses.push('o.created_at <= @endDate');
      req.input('endDate', sql.DateTime2, new Date(endDate));
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await req.query(`
      SELECT COUNT(*) AS total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereSql}
    `);
    const total = countRes.recordset[0].total;

    req.input('offset', sql.Int, offset);
    req.input('limitNum', sql.Int, limitNum);
    const dataRes = await req.query(`
      SELECT o.*, u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${whereSql}
      ORDER BY o.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limitNum ROWS ONLY
    `);

    return {
      items: dataRes.recordset,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Lấy tất cả đơn hàng (Admin backward compatible)
   */
  static async getAllOrders() {
    const res = await query(`
      SELECT o.*, u.full_name AS customer_name, u.phone AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    return res.recordset;
  }

  /**
   * Lấy danh sách lịch sử giao dịch thanh toán (Admin)
   */
  static async getAllPaymentTransactions({ page = 1, limit = 20 } = {}) {
    const pool = await poolPromise;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countRes = await pool.request().query('SELECT COUNT(*) AS total FROM payment_transactions');
    const total = countRes.recordset[0].total;

    const res = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limitNum', sql.Int, limitNum)
      .query(`
        SELECT pt.*, o.order_code, o.total_amount AS order_total, o.status AS order_status
        FROM payment_transactions pt
        LEFT JOIN orders o ON pt.order_id = o.id
        ORDER BY pt.paid_at DESC
        OFFSET @offset ROWS FETCH NEXT @limitNum ROWS ONLY
      `);

    return {
      items: res.recordset,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin)
   */
  static async updateStatus(id, status) {
    await query(`UPDATE orders SET status = @status WHERE id = @id`, { id, status });
    return true;
  }

  /**
   * Tra cứu giao dịch thanh toán theo transaction_code
   */
  static async findTransactionByCode(transactionCode) {
    if (!transactionCode) return null;
    const res = await query(`
      SELECT * FROM payment_transactions 
      WHERE transaction_code = @transactionCode
    `, { transactionCode: String(transactionCode).trim() });
    return res.recordset[0] || null;
  }

  /**
   * Tính tổng số tiền đã thanh toán thành công của đơn hàng
   */
  static async getPaidAmountForOrder(orderId) {
    const res = await query(`
      SELECT ISNULL(SUM(amount), 0) AS total_paid
      FROM payment_transactions
      WHERE order_id = @orderId AND status = 'SUCCESS'
    `, { orderId });
    return Number(res.recordset[0].total_paid) || 0;
  }

  /**
   * Ghi nhận giao dịch và cập nhật trạng thái đơn hàng nguyên tử (Atomic SQL Transaction & Idempotency)
   */
  static async recordPaymentAndProcessOrder({
    orderId,
    transactionCode,
    paymentMethod = 'SEPAY_QR',
    amount,
    gatewayResponseCode = '00',
    txStatus = 'SUCCESS',
    newPaymentStatus,
    newOrderStatus
  }) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Kiểm tra sự tồn tại của transaction_code với UPDLOCK, ROWLOCK để chống xử lý đồng thời
      const checkTxReq = new sql.Request(transaction);
      checkTxReq.input('transCode', sql.NVarChar(64), transactionCode);
      const checkTxRes = await checkTxReq.query(`
        SELECT id, transaction_code, order_id, amount, status 
        FROM payment_transactions WITH (UPDLOCK, ROWLOCK)
        WHERE transaction_code = @transCode
      `);

      if (checkTxRes.recordset.length > 0) {
        await OrderRepository.safeRollback(transaction, 'recordPaymentAndProcessOrder: duplicate transaction');
        return {
          duplicate: true,
          existingTransaction: checkTxRes.recordset[0]
        };
      }

      // 2. Chèn vào payment_transactions (Được bảo vệ bởi UNIQUE constraint UQ__payment___DD5740BEE83CA53E)
      const insTxReq = new sql.Request(transaction);
      insTxReq.input('transCode', sql.NVarChar(64), transactionCode);
      insTxReq.input('orderId', sql.Int, orderId);
      insTxReq.input('paymentMethod', sql.NVarChar(30), paymentMethod);
      insTxReq.input('amount', sql.Decimal(18, 2), amount);
      insTxReq.input('gatewayResponseCode', sql.NVarChar(20), gatewayResponseCode);
      insTxReq.input('status', sql.NVarChar(30), txStatus);

      await insTxReq.query(`
        INSERT INTO payment_transactions (
          transaction_code, order_id, payment_method, amount, gateway_response_code, status, paid_at
        )
        VALUES (
          @transCode, @orderId, @paymentMethod, @amount, @gatewayResponseCode, @status, SYSDATETIME()
        )
      `);

      // 3. Khóa hàng và cập nhật đơn hàng (nếu có yêu cầu đổi trạng thái)
      if (newPaymentStatus || newOrderStatus) {
        const updateOrderReq = new sql.Request(transaction);
        updateOrderReq.input('orderId', sql.Int, orderId);
        updateOrderReq.input('newPaymentStatus', sql.NVarChar(30), newPaymentStatus || null);
        updateOrderReq.input('newOrderStatus', sql.NVarChar(30), newOrderStatus || null);
        updateOrderReq.input('paymentMethod', sql.NVarChar(30), paymentMethod);

        await updateOrderReq.query(`
          UPDATE orders WITH (UPDLOCK, ROWLOCK)
          SET 
            payment_status = ISNULL(@newPaymentStatus, payment_status),
            status = ISNULL(@newOrderStatus, status),
            payment_method = @paymentMethod
          WHERE id = @orderId
        `);
      }

      await transaction.commit();
      return { success: true, duplicate: false, transactionCode };
    } catch (err) {
      await OrderRepository.safeRollback(transaction, 'recordPaymentAndProcessOrder: error');
      // Bắt lỗi vi phạm khóa duy nhất SQL Server (Error code 2627 hoặc 2601)
      if (err.number === 2627 || err.number === 2601) {
        return { duplicate: true, constraintViolated: true };
      }
      throw err;
    }
  }
}

module.exports = OrderRepository;

