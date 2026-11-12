-- ===================================================================
-- AURALIÈ Haute Couture - Database Schema (SQL Script hoàn chỉnh 100%)
-- Thích hợp cho PostgreSQL / MySQL
-- ===================================================================

-- 1. Bảng Phân Quyền (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Bảng Người Dùng (Users & VIP Loyalty)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    vip_tier VARCHAR(30) DEFAULT 'SILVER VIP', -- SILVER VIP, GOLD VIP, PLATINUM VIP
    vip_points INT DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh Mục Sản Phẩm (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 4. Bảng Sản Phẩm (Products)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    tag VARCHAR(50) DEFAULT 'NEW ARRIVAL', -- NEW ARRIVAL, BESTSELLER, LIMITED, EXCLUSIVE
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Biến Thể Sản Phẩm (Product Variants: Size, Color, Stock)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock_quantity INT DEFAULT 0,
    variant_price DECIMAL(12, 2),
    sku VARCHAR(50) UNIQUE
);

-- 6. Bảng Hình Ảnh Sản Phẩm (Product Images)
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE
);

-- 7. Bảng Đơn Hàng (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_fee DECIMAL(12, 2) DEFAULT 0,
    shipping_address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'COD', -- COD, VNPAY_QR, VISA
    payment_status VARCHAR(30) DEFAULT 'UNPAID', -- UNPAID, PAID, REFUNDED
    tracking_code VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, PROCESSING, SHIPPED, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Chi Tiết Đơn Hàng (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL
);

-- 9. Bảng Mã Giảm Giá (Coupons / Vouchers)
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENT', -- PERCENT, FIXED
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    max_discount_amount DECIMAL(12, 2),
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. Bảng Đánh Giá Sản Phẩm (Product Reviews - Rich Media & Admin Reply)
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    variant_info VARCHAR(100),
    image_url TEXT,
    admin_reply TEXT,
    is_verified_buyer BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bảng Danh Sách Yêu Thích (Wishlists)
CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 12. Bảng Bài Viết Tạp Chí Thời Trang (Blogs / Articles)
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- XU HƯỚNG, HAUTE COUTURE, PHỐI ĐỒ
    summary TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author_name VARCHAR(100) DEFAULT 'AURALIÈ Editor',
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bảng Phiên Trò Chuyện Trợ Lý AI (AI Chat Sessions)
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(64) NOT NULL UNIQUE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(30) DEFAULT 'WEB_WIDGET', -- WEB_WIDGET, MOBILE_APP, ZALO_OA
    status VARCHAR(30) DEFAULT 'ACTIVE', -- ACTIVE, CLOSED, ESCALATED_TO_HUMAN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Bảng Nhật Ký Tin Nhắn Trợ Lý AI (AI Chat Messages & Voice/Photo Attachments)
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- USER, AI_BOT, HUMAN_AGENT
    message_text TEXT,
    attachment_type VARCHAR(30), -- NONE, PHOTO_STYLING, VOICE_AUDIO
    attachment_url TEXT,
    intent_detected VARCHAR(50), -- RECOMMEND_OUTFIT, SIZE_GUIDE, COUPON_REQUEST, ORDER_TRACKING
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Bảng Trích Xuất Vector Đặc Trưng AI Tìm Kiếm Hình Ảnh (AI Computer Vision Feature Vector)
CREATE TABLE IF NOT EXISTS ai_image_embeddings (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    feature_vector_json TEXT NOT NULL, -- Mảng vector đặc trưngResNet50 / CLIP
    detected_category VARCHAR(100),
    confidence_score DECIMAL(5, 2) DEFAULT 98.50,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Bảng Nhắc Nhở Giỏ Hàng Bỏ Quên & Push Marketing (Abandoned Carts Recovery)
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(150) NOT NULL,
    cart_data_json TEXT NOT NULL, -- Dữ liệu danh sách sản phẩm trong giỏ
    abandoned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reminder_sent_count INT DEFAULT 0,
    last_notified_at TIMESTAMP,
    coupon_code_offered VARCHAR(50) DEFAULT 'AURALIE2026',
    status VARCHAR(30) DEFAULT 'PENDING' -- PENDING, NOTIFIED, RECOVERED, EXPIRED
);

-- 17. Bảng Quản Lý Lô Hàng Nhập Kho Hàng Loạt (Inventory Batch Import Logs)
CREATE TABLE IF NOT EXISTS inventory_imports (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(150) NOT NULL,
    total_quantity INT NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    imported_by VARCHAR(100) DEFAULT 'Admin System',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Bảng Lịch Sử Giao Dịch Thanh Toán (Payment Transactions - VNPAY QR, VISA, COD)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(64) NOT NULL UNIQUE,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL, -- VNPAY_QR, VISA, COD
    amount DECIMAL(12, 2) NOT NULL,
    gateway_response_code VARCHAR(20) DEFAULT '00',
    status VARCHAR(30) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, PENDING, REFUNDED
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
