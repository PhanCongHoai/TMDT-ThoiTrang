const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');
const ApiResponse = require('../../utils/response');

// POST Contact / Appointment Booking
router.post('/contact', async (req, res, next) => {
  try {
    const { fullName, email, phone, service, message } = req.body;
    if (!fullName || !email) {
      return ApiResponse.error(res, 'Vui lòng nhập đầy đủ họ tên và email.', 400);
    }
    if (!email.includes('@')) {
      return ApiResponse.error(res, 'Địa chỉ email không hợp lệ.', 400);
    }

    await query(`
      INSERT INTO contact_inquiries (full_name, email, phone, service, message, status)
      VALUES (@fullName, @email, @phone, @service, @message, 'PENDING')
    `, {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      service: service || 'Tư vấn chung',
      message: message ? message.trim() : ''
    });

    return ApiResponse.success(res, null, 'Yêu cầu tư vấn của bạn đã được ghi nhận! Chuyên viên VIP sẽ liên hệ trong vòng 30 phút.', 201);
  } catch (err) {
    next(err);
  }
});

// GET All Contact Inquiries (Admin)
router.get('/admin/inquiries', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM contact_inquiries ORDER BY created_at DESC');
    return ApiResponse.success(res, result.recordset, 'Lấy danh sách yêu cầu tư vấn thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

// POST Newsletter Subscribe
router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return ApiResponse.error(res, 'Vui lòng nhập địa chỉ email hợp lệ.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM newsletter_subscribers WHERE email = @email', { email: cleanEmail });
    if (existing.recordset.length > 0) {
      return ApiResponse.success(res, null, 'Email này đã được đăng ký nhận bản tin AURALIÈ!');
    }

    await query(`
      INSERT INTO newsletter_subscribers (email, name, is_active)
      VALUES (@email, @name, 1)
    `, { email: cleanEmail, name: name ? name.trim() : '' });

    return ApiResponse.success(res, null, `Cảm ơn! Email ${cleanEmail} đã được thêm vào danh sách nhận bản tin AURALIÈ độc quyền.`, 201);
  } catch (err) {
    next(err);
  }
});

// GET All Subscribers (Admin)
router.get('/admin/newsletter-subscribers', verifyToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    return ApiResponse.success(res, result.recordset, 'Lấy danh sách đăng ký nhận tin thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
