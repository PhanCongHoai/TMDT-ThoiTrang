const { createHmac, randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { query } = require('../../config/db');
const { JWT_SECRET } = require('../../config/env');
const ApiResponse = require('../../utils/response');
const logger = require('../../utils/logger');

const purpose = 'password-reset';
const invalidLink = 'Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.';
const requestMessage = 'Nếu email thuộc một tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu.';

function signingKey(passwordHash) {
  return createHmac('sha256', JWT_SECRET).update(`${purpose}:${passwordHash}`).digest();
}

function mailSettings() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, PASSWORD_RESET_URL } = process.env;
  if (!SMTP_HOST || !SMTP_FROM || !PASSWORD_RESET_URL || Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) return null;
  let url;
  try {
    url = new URL(PASSWORD_RESET_URL);
  } catch {
    return null;
  }
  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHosts.includes(url.hostname))) return null;
  const secure = SMTP_SECURE === 'true';
  return {
    from: SMTP_FROM,
    url,
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || (secure ? 465 : 587)),
      secure,
      requireTLS: !secure && !localHosts.includes(SMTP_HOST),
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
      connectionTimeout: 8000,
      socketTimeout: 12000
    })
  };
}

async function requestReset(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.error(res, 'Vui lòng nhập địa chỉ email hợp lệ.', 400);
    }
    const mail = mailSettings();
    if (!mail) return ApiResponse.error(res, 'Dịch vụ email đặt lại mật khẩu chưa được cấu hình.', 503);

    const result = await query('SELECT id, email, password_hash FROM users WHERE email = @email', { email });
    const user = result.recordset[0];
    if (user) {
      const token = jwt.sign({ id: user.id, purpose }, signingKey(user.password_hash), {
        algorithm: 'HS256', expiresIn: '30m', jwtid: randomUUID()
      });
      mail.url.hash = new URLSearchParams({ reset: token }).toString();
      mail.transport.sendMail({
        from: mail.from,
        to: user.email,
        subject: 'AURALIÈ – Đặt lại mật khẩu',
        text: `Mở liên kết sau để đặt lại mật khẩu: ${mail.url}\n\nLiên kết dùng một lần và hết hạn sau 30 phút.`
      }).catch(error => logger.error(`[Password reset] Gửi email thất bại (${error.code || 'SMTP'}).`));
    }
    return ApiResponse.success(res, null, requestMessage, 202);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
      return ApiResponse.error(res, 'Mật khẩu cần ít nhất 6 ký tự và tối đa 72 byte.', 400);
    }
    if (typeof token !== 'string' || token.length > 1024) return ApiResponse.error(res, invalidLink, 400);

    const payload = jwt.decode(token);
    if (!Number.isInteger(payload?.id) || payload.id < 1 || payload.id > 2147483647 || payload.purpose !== purpose) {
      return ApiResponse.error(res, invalidLink, 400);
    }
    const { id } = payload;
    const result = await query('SELECT password_hash FROM users WHERE id = @id', { id });
    const currentHash = result.recordset[0]?.password_hash;
    if (!currentHash) return ApiResponse.error(res, invalidLink, 400);

    try {
      jwt.verify(token, signingKey(currentHash), { algorithms: ['HS256'] });
    } catch {
      return ApiResponse.error(res, invalidLink, 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const update = await query(`
      UPDATE users SET password_hash = @passwordHash
      WHERE id = @id AND password_hash COLLATE Latin1_General_100_BIN2 = @currentHash
    `, { id, passwordHash, currentHash });
    if (!update.rowsAffected[0]) return ApiResponse.error(res, invalidLink, 400);

    return ApiResponse.success(res, null, 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.');
  } catch (error) {
    next(error);
  }
}

module.exports = { requestReset, resetPassword };
