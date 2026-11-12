const express = require('express');
const router = express.Router();
const ReviewController = require('./reviews.controller');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');

// Public endpoints
router.get('/products/:id/reviews', ReviewController.getProductReviews);
router.post('/reviews', ReviewController.createReview);

// Admin-only endpoints
router.get('/admin/reviews', verifyToken, requireAdmin, ReviewController.getAdminReviews);
router.put('/reviews/:id/approve', verifyToken, requireAdmin, ReviewController.approveReview);
router.delete('/reviews/:id', verifyToken, requireAdmin, ReviewController.deleteReview);

module.exports = router;

