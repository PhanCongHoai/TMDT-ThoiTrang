const express = require('express');
const router = express.Router();
const CategoryController = require('./categories.controller');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');

// Public endpoints
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);

// Admin-only endpoints (Yêu cầu quyền Quản trị viên)
router.post('/', verifyToken, requireAdmin, CategoryController.create);
router.put('/:id', verifyToken, requireAdmin, CategoryController.update);
router.delete('/:id', verifyToken, requireAdmin, CategoryController.delete);

module.exports = router;
