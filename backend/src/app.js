const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { query } = require('./config/db');
const { globalLimiter } = require('./middlewares/rateLimit.middleware');
const errorHandler = require('./middlewares/error.middleware');
const notFoundHandler = require('./middlewares/notFound.middleware');
const ApiResponse = require('./utils/response');

// Import Modules Routes
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/products.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const reviewRoutes = require('./modules/reviews/reviews.routes');
const couponRoutes = require('./modules/coupons/coupons.routes');
const userRoutes = require('./modules/users/users.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const blogRoutes = require('./modules/blogs/blogs.routes');
const inquiryRoutes = require('./modules/inquiries/inquiries.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const trackingRoutes = require('./modules/tracking/tracking.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const app = express();

// ====================================================================
// GLOBAL SECURITY & PARSING MIDDLEWARES
// ====================================================================
app.use(helmet({
  crossOriginResourcePolicy: false // Phục vụ ảnh tĩnh cho frontend
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (ví dụ curl, mobile app) hoặc nằm trong whitelist
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
      return callback(null, true);
    }
    return callback(new Error('Chặn bởi chính sách CORS của AURALIÈ'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// ====================================================================
// HEALTH CHECK
// ====================================================================
app.get('/api/health', async (req, res, next) => {
  try {
    const result = await query('SELECT COUNT(*) AS total_products FROM products');
    return res.json({
      status: 'success',
      message: 'AURALIÈ Haute Couture Enterprise API is running with Live Database',
      database: 'Microsoft SQL Server (AURALIE_FashionDB)',
      totalProductsInDB: result.recordset[0].total_products,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// ====================================================================
// API V1 MODULES MOUNTING
// ====================================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1', orderRoutes); // bao gồm /api/v1/orders, /api/v1/sepay/*
app.use('/api/v1', reviewRoutes); // bao gồm /api/v1/products/:id/reviews, /api/v1/admin/reviews
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1', inquiryRoutes); // bao gồm /api/v1/contact, /api/v1/newsletter/subscribe
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/admin', analyticsRoutes);
app.use('/api/v1/admin', analyticsRoutes);

// ====================================================================
// 404 CATCH-ALL ROUTE
// ====================================================================
app.use(notFoundHandler);

// ====================================================================
// GLOBAL ERROR HANDLER
// ====================================================================
app.use(errorHandler);

module.exports = app;

