const express = require('express');
const router = express.Router();
const ProductController = require('../products/products.controller');

router.get('/', ProductController.getCategories);

module.exports = router;

