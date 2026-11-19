const express = require('express');
const router = express.Router();
const ProductController = require('./products.controller');
const ProductValidation = require('./products.validation');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');

// Public endpoints
router.get('/', ProductController.getProducts);
router.get('/filters', ProductController.getFilters);
router.get('/:id', ProductValidation.validateGetById, ProductController.getProductById);

// Admin-only endpoints với validation và RBAC guard
router.post('/', verifyToken, requireAdmin, ProductValidation.validateCreateProduct, ProductController.createProduct);
router.delete('/:id', verifyToken, requireAdmin, ProductValidation.validateDeleteProduct, ProductController.deleteProduct);

module.exports = router;
