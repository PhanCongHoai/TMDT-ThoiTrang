const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const TrackingController = require('./tracking.controller');
const { optionalAuth } = require('../../middlewares/auth.middleware');

// Rate limiter riêng chống spam tracking endpoint (tối đa 120 request/phút/IP)
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Quá nhiều sự kiện gửi từ thiết bị này.' }
});

router.use(trackingLimiter);
router.use(optionalAuth);

router.post('/consent', TrackingController.saveConsent);
router.post('/session/start', TrackingController.startSession);
router.post('/session/heartbeat', TrackingController.heartbeat);
router.post('/events', TrackingController.trackSingleEvent);
router.post('/events/batch', TrackingController.trackBatchEvents);
router.post('/cart-sync', TrackingController.syncCart);

module.exports = router;

