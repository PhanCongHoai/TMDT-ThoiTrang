const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const PasswordReset = require('./password-reset');
const AuthValidation = require('./auth.validation');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authLimiter, passwordResetLimiter } = require('../../middlewares/rateLimit.middleware');

// Public endpoints có gắn rate-limit và validation
router.post('/register', authLimiter, AuthValidation.validateRegister, AuthController.register);
router.post('/login', authLimiter, AuthValidation.validateLogin, AuthController.login);

router.post('/forgot-password', passwordResetLimiter, PasswordReset.requestReset);
router.post('/reset-password', passwordResetLimiter, PasswordReset.resetPassword);

// Private endpoints yêu cầu JWT token hợp lệ
router.get('/me', verifyToken, AuthController.getMe);
router.put('/change-password', verifyToken, AuthValidation.validateChangePassword, AuthController.changePassword);

module.exports = router;
