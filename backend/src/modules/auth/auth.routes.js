const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const AuthValidation = require('./auth.validation');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');

// Public endpoints có gắn rate-limit và validation
router.post('/register', authLimiter, AuthValidation.validateRegister, AuthController.register);
router.post('/login', authLimiter, AuthValidation.validateLogin, AuthController.login);

// Private endpoints yêu cầu JWT token hợp lệ
router.get('/me', verifyToken, AuthController.getMe);
router.put('/change-password', verifyToken, AuthValidation.validateChangePassword, AuthController.changePassword);

module.exports = router;
