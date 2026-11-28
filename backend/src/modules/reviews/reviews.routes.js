const express = require('express');
const router = express.Router();
const ReviewController = require('./reviews.controller');
const { verifyToken, requireAdmin } = require('../../middlewares/auth.middleware');

// Public endpoints
router.get('/products/:id/reviews', ReviewController.getProductReviews);
router.get('/products/:id/reviews/eligibility', ReviewController.checkEligibility);
router.post('/reviews', ReviewController.createReview);
router.post('/reviews/:id/like', ReviewController.likeReview);

// Admin-only endpoints
router.get('/admin/reviews', verifyToken, requireAdmin, ReviewController.getAdminReviews);
router.put('/reviews/:id/approve', verifyToken, requireAdmin, ReviewController.approveReview);
router.delete('/reviews/:id', verifyToken, requireAdmin, ReviewController.deleteReview);

module.exports = router;

