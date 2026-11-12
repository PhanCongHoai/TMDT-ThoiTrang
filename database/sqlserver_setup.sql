-- ===================================================================
-- ĐỒ ÁN TỐT NGHIỆP: AURALIÈ HAUTE COUTURE - E-COMMERCE PLATFORM
-- T-SQL SCRIPT CHO MICROSOFT SQL SERVER 2016 / 2019 / 2022
-- Bao gồm: Tạo Database, 18 Bảng, Ràng buộc Khóa Ngoại và Dữ liệu mẫu
-- ===================================================================

-- 1. TẠO CƠ SỞ DỮ LIỆU
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AURALIE_FashionDB')
BEGIN
    CREATE DATABASE [AURALIE_FashionDB] COLLATE Vietnamese_CI_AS;
    PRINT N'>>> Đã tạo thành công cơ sở dữ liệu [AURALIE_FashionDB]!';
END
ELSE
BEGIN
    PRINT N'>>> Cơ sở dữ liệu [AURALIE_FashionDB] đã tồn tại, tiến hành sử dụng database.';
END
GO

USE [AURALIE_FashionDB];
GO

-- ===================================================================
-- 2. DỌN DẸP BẢNG CŨ (NẾU CÓ) ĐỂ TÁI TẠO MỚI CHUẨN XÁC
-- ===================================================================
IF OBJECT_ID(N'payment_transactions', N'U') IS NOT NULL DROP TABLE payment_transactions;
IF OBJECT_ID(N'inventory_imports', N'U') IS NOT NULL DROP TABLE inventory_imports;
IF OBJECT_ID(N'abandoned_carts', N'U') IS NOT NULL DROP TABLE abandoned_carts;
IF OBJECT_ID(N'ai_image_embeddings', N'U') IS NOT NULL DROP TABLE ai_image_embeddings;
IF OBJECT_ID(N'ai_chat_messages', N'U') IS NOT NULL DROP TABLE ai_chat_messages;
IF OBJECT_ID(N'ai_chat_sessions', N'U') IS NOT NULL DROP TABLE ai_chat_sessions;
IF OBJECT_ID(N'blogs', N'U') IS NOT NULL DROP TABLE blogs;
IF OBJECT_ID(N'wishlists', N'U') IS NOT NULL DROP TABLE wishlists;
IF OBJECT_ID(N'product_reviews', N'U') IS NOT NULL DROP TABLE product_reviews;
IF OBJECT_ID(N'coupons', N'U') IS NOT NULL DROP TABLE coupons;
IF OBJECT_ID(N'order_items', N'U') IS NOT NULL DROP TABLE order_items;
IF OBJECT_ID(N'orders', N'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID(N'product_images', N'U') IS NOT NULL DROP TABLE product_images;
IF OBJECT_ID(N'product_variants', N'U') IS NOT NULL DROP TABLE product_variants;
IF OBJECT_ID(N'products', N'U') IS NOT NULL DROP TABLE products;
IF OBJECT_ID(N'categories', N'U') IS NOT NULL DROP TABLE categories;
IF OBJECT_ID(N'users', N'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID(N'roles', N'U') IS NOT NULL DROP TABLE roles;
GO

PRINT N'>>> Bắt đầu tạo 18 bảng theo kiến trúc CSDL AURALIÈ...';
GO

-- 1. Bảng Phân Quyền (Roles)
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL UNIQUE
);

-- 2. Bảng Người Dùng & Hội Viên VIP (Users)
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    address NVARCHAR(MAX),
    role_id INT NULL,
    vip_tier NVARCHAR(30) DEFAULT N'SILVER VIP', -- SILVER VIP, GOLD VIP, PLATINUM VIP
    vip_points INT DEFAULT 0,
    total_spent DECIMAL(18, 2) DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- 3. Bảng Danh Mục Sản Phẩm (Categories)
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(MAX)
);

-- 4. Bảng Sản Phẩm Haute Couture (Products)
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    slug NVARCHAR(200) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    base_price DECIMAL(18, 2) NOT NULL,
    category_id INT NULL,
    tag NVARCHAR(50) DEFAULT N'NEW ARRIVAL', -- NEW ARRIVAL, BESTSELLER, LIMITED, EXCLUSIVE
    material NVARCHAR(150) DEFAULT N'100% Cashmere Lụa Ý',
    fit NVARCHAR(100) DEFAULT N'European Tailored Fit',
    lining NVARCHAR(150) DEFAULT N'Lụa Cupro Thượng Hạng',
    hardware NVARCHAR(150) DEFAULT N'Khuy Sừng / Khóa Mạ Vàng 18K',
    origin NVARCHAR(150) DEFAULT N'Atelier AURALIÈ',
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 5. Bảng Biến Thể Sản Phẩm (Product Variants: Size, Color, Stock, SKU)
CREATE TABLE product_variants (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    size NVARCHAR(20) NOT NULL,
    color NVARCHAR(100) NOT NULL,
    stock_quantity INT DEFAULT 0,
    variant_price DECIMAL(18, 2),
    sku NVARCHAR(50) UNIQUE,
    CONSTRAINT FK_Variants_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. Bảng Hình Ảnh Sản Phẩm (Product Images Gallery)
CREATE TABLE product_images (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    is_thumbnail BIT DEFAULT 0,
    CONSTRAINT FK_Images_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 7. Bảng Đơn Hàng (Orders)
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    order_code NVARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(18, 2) NOT NULL,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    shipping_fee DECIMAL(18, 2) DEFAULT 0,
    shipping_address NVARCHAR(MAX) NOT NULL,
    phone_number NVARCHAR(20) NOT NULL,
    payment_method NVARCHAR(30) DEFAULT N'COD', -- COD, VNPAY_QR, VISA
    payment_status NVARCHAR(30) DEFAULT N'UNPAID', -- UNPAID, PAID, REFUNDED
    tracking_code NVARCHAR(50),
    status NVARCHAR(30) DEFAULT N'PENDING', -- PENDING, PROCESSING, SHIPPED, COMPLETED, CANCELLED
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Bảng Chi Tiết Đơn Hàng (Order Items)
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Variants FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- 9. Bảng Mã Giảm Giá Đặc Quyền (Coupons / Vouchers)
CREATE TABLE coupons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    discount_type NVARCHAR(20) NOT NULL DEFAULT N'PERCENT', -- PERCENT, FIXED
    discount_value DECIMAL(18, 2) NOT NULL,
    min_order_amount DECIMAL(18, 2) DEFAULT 0,
    max_discount_amount DECIMAL(18, 2),
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    expiry_date DATETIME2,
    is_active BIT DEFAULT 1
);

-- 10. Bảng Đánh Giá & Phản Hồi Khách Hàng (Product Reviews)
CREATE TABLE product_reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    user_name NVARCHAR(100) NOT NULL,
    user_email NVARCHAR(150),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX) NOT NULL,
    variant_info NVARCHAR(100),
    image_url NVARCHAR(MAX),
    admin_reply NVARCHAR(MAX),
    is_verified_buyer BIT DEFAULT 1,
    helpful_count INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Reviews_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. Bảng Danh Sách Yêu Thích (Wishlists)
CREATE TABLE wishlists (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_Wishlists UNIQUE(user_id, product_id),
    CONSTRAINT FK_Wishlists_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Wishlists_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 12. Bảng Tạp Chí Thời Trang (Blogs / Articles)
CREATE TABLE blogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    slug NVARCHAR(255) NOT NULL UNIQUE,
    category NVARCHAR(100) NOT NULL, -- XU HƯỚNG, HAUTE COUTURE, PHỐI ĐỒ
    summary NVARCHAR(MAX),
    content NVARCHAR(MAX) NOT NULL,
    cover_image NVARCHAR(MAX),
    author_name NVARCHAR(100) DEFAULT N'AURALIÈ Editorial Team',
    published_at DATETIME2 DEFAULT GETDATE()
);

-- 13. Bảng Phiên Trò Chuyện Trợ Lý AI (AI Chat Sessions)
CREATE TABLE ai_chat_sessions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_code NVARCHAR(64) NOT NULL UNIQUE,
    user_id INT NULL,
    channel NVARCHAR(30) DEFAULT N'WEB_WIDGET', -- WEB_WIDGET, MOBILE_APP, ZALO_OA
    status NVARCHAR(30) DEFAULT N'ACTIVE', -- ACTIVE, CLOSED, ESCALATED_TO_HUMAN
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ChatSessions_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Bảng Nhật Ký Tin Nhắn Trợ Lý AI (AI Chat Messages)
CREATE TABLE ai_chat_messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    sender_type NVARCHAR(20) NOT NULL, -- USER, AI_BOT, HUMAN_AGENT
    message_text NVARCHAR(MAX),
    attachment_type NVARCHAR(30) DEFAULT N'NONE', -- NONE, PHOTO_STYLING, VOICE_AUDIO
    attachment_url NVARCHAR(MAX),
    intent_detected NVARCHAR(50), -- RECOMMEND_OUTFIT, SIZE_GUIDE, COUPON_REQUEST, ORDER_TRACKING
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ChatMessages_Sessions FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

-- 15. Bảng Vector Đặc Trưng AI Tìm Kiếm Hình Ảnh (AI Computer Vision Embeddings)
CREATE TABLE ai_image_embeddings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    feature_vector_json NVARCHAR(MAX) NOT NULL, -- Chuỗi JSON lưu 512 chiều feature vector
    detected_category NVARCHAR(100),
    confidence_score DECIMAL(5, 2) DEFAULT 98.50,
    indexed_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ImageEmbeddings_Products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 16. Bảng Phục Hồi Giỏ Hàng Bỏ Quên & Tiếp Thị Lại (Abandoned Carts Recovery)
CREATE TABLE abandoned_carts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    user_email NVARCHAR(150) NOT NULL,
    cart_data_json NVARCHAR(MAX) NOT NULL, -- Dữ liệu JSON các sản phẩm trong giỏ
    abandoned_at DATETIME2 DEFAULT GETDATE(),
    reminder_sent_count INT DEFAULT 0,
    last_notified_at DATETIME2,
    coupon_code_offered NVARCHAR(50) DEFAULT N'AURALIE2026',
    status NVARCHAR(30) DEFAULT N'PENDING', -- PENDING, NOTIFIED, RECOVERED, EXPIRED
    CONSTRAINT FK_AbandonedCarts_Users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. Bảng Quản Lý Nhập Kho Hàng Loạt (Inventory Batch Import Logs)
CREATE TABLE inventory_imports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_code NVARCHAR(50) NOT NULL UNIQUE,
    supplier_name NVARCHAR(150) NOT NULL,
    total_quantity INT NOT NULL,
    total_cost DECIMAL(18, 2) NOT NULL,
    imported_by NVARCHAR(100) DEFAULT N'Admin System',
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 18. Bảng Lịch Sử Giao Dịch Thanh Toán (Payment Transactions - VNPAY, VISA, COD)
CREATE TABLE payment_transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    transaction_code NVARCHAR(64) NOT NULL UNIQUE,
    order_id INT NOT NULL,
    payment_method NVARCHAR(30) NOT NULL, -- VNPAY_QR, VISA, COD
    amount DECIMAL(18, 2) NOT NULL,
    gateway_response_code NVARCHAR(20) DEFAULT N'00',
    status NVARCHAR(30) DEFAULT N'SUCCESS', -- SUCCESS, FAILED, PENDING, REFUNDED
    paid_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_PaymentTransactions_Orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
GO

PRINT N'>>> Đã khởi tạo hoàn tất 18 bảng CSDL!';
GO

-- ===================================================================
-- 3. NẠP DỮ LIỆU MẪU (SEED DATA CHUẨN ĐỒ ÁN TỐT NGHIỆP)
-- ===================================================================
PRINT N'>>> Bắt đầu nạp dữ liệu mẫu vào SQL Server...';
GO

-- 1. Roles
SET IDENTITY_INSERT roles ON;
INSERT INTO roles (id, role_name) VALUES 
(1, N'ADMIN'),
(2, N'CUSTOMER');
SET IDENTITY_INSERT roles OFF;
GO

-- 2. Users (VIP Loyalty & Admin)
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, full_name, email, password_hash, phone, address, role_id, vip_tier, vip_points, total_spent) VALUES
(1, N'Quản Trị Viên Executive', N'admin@auralie.fashion', N'$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', N'0909000111', N'Atelier AURALIÈ, 15 Đồng Khởi, Q.1, TP.HCM', 1, N'PLATINUM VIP', 9999, 500000000.00),
(2, N'Nguyễn Thanh Vân', N'thanhvan.nguyen@gmail.com', N'$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', N'0908888999', N'Căn hộ 45.02, Tháp Landmark 81, Q.Bình Thạnh, TP.HCM', 2, N'PLATINUM VIP', 2450, 125000000.00),
(3, N'Phạm Hoàng My', N'hoangmy.pham@hotmail.com', N'$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', N'0912345678', N'Villa Golden River Aqua 1, Q.1, TP.HCM', 2, N'GOLD VIP', 1350, 68500000.00),
(4, N'Trần Đình Trọng', N'trong.tran@outlook.com', N'$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', N'0933112233', N'Khu Đô Thị Sala, TP.Thủ Đức, TP.HCM', 2, N'SILVER VIP', 450, 24000000.00),
(5, N'Lê Bảo Long', N'long.le@gmail.com', N'$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', N'0977665544', N'Khu Biệt Thự Thảo Điền, Q.2, TP.HCM', 2, N'SILVER VIP', 250, 12500000.00);
SET IDENTITY_INSERT users OFF;
GO

-- 3. Categories (5 Danh mục thời trang xa xỉ)
SET IDENTITY_INSERT categories ON;
INSERT INTO categories (id, name, slug, description) VALUES
(1, N'Áo Vest & Blazer', N'vest-blazer', N'Bộ sưu tập áo vest và blazer tailored may đo chuẩn Châu Âu cho phong cách thượng lưu'),
(2, N'Váy & Đầm Dạ Hội', N'vay-dam', N'Đầm lụa tơ tằm, đầm dạ hội sang trọng kiêu sa đính đá quý thủ công'),
(3, N'Áo Khoác Thu Đông', N'ao-khoac', N'Áo khoác dạ măng-tô, áo choàng len Cashmere ấm áp và đẳng cấp'),
(4, N'Túi Xách Da Cao Cấp', N'tui-xach', N'Túi xách da bò thuộc Ý, da đà điểu và ví cầm tay khâu tay tinh xảo'),
(5, N'Giày & Phụ Kiện', N'giay-phu-kien', N'Boots da bò, Loafers da bê cao cấp và phụ kiện trang sức mạ vàng 18K');
SET IDENTITY_INSERT categories OFF;
GO

-- 4. Products (20 Sản phẩm cho 5 danh mục)
SET IDENTITY_INSERT products ON;
INSERT INTO products (id, name, slug, description, base_price, category_id, tag, material, fit, lining, hardware, origin) VALUES
-- Danh mục 1: Áo Vest & Blazer
(1, N'Double-Breasted Tailored Suit', N'double-breasted-tailored-suit', N'Áo Vest may đo độc bản từ len Cashmere nhập khẩu Ý. Thiết kế Double-Breasted quyền lực chuẩn phom Châu Âu.', 12500000.00, 1, N'NEW ARRIVAL', N'100% Cashmere Lụa Ý', N'European Tailored Fit', N'Lụa Cupro Thượng Hạng', N'Khuy Sừng / Khóa Mạ Vàng 18K', N'Atelier AURALIÈ Đồng Khởi'),
(2, N'Black Blazer & High Boots Set', N'black-blazer-high-boots-set', N'Bộ Blazer đen huyền bí phối cùng boots cổ cao hiện đại. Điểm nhấn chiết eo thon gọn và đường cắt thủ công.', 16800000.00, 1, N'BESTSELLER', N'Len Cừu Merinos & Silk', N'Slim Structured Cut', N'Lụa Tơ Tằm Bảo Lộc', N'Khuy Kim Loại Mạ Vàng', N'Atelier AURALIÈ'),
(3, N'Royal Cashmere Velvet Tuxedo', N'royal-cashmere-velvet-tuxedo', N'Tuxedo nhung cao cấp phối ve áo lụa satin bóng. Trang phục hoàn hảo cho các đêm dạ tiệc Black Tie.', 19500000.00, 1, N'EXCLUSIVE', N'Nhung Velvet Cashmere', N'Tailored Black Tie Fit', N'Lụa Satin Cao Cấp', N'Khuy Bọc Lụa Thủ Công', N'Atelier AURALIÈ'),
(4, N'Italian Wool Tailored Blazer', N'italian-wool-tailored-blazer', N'Blazer may thủ công từ len cừu Ý cao cấp. Phom dáng quyền lực dành riêng cho quý ông và quý cô công sở thượng lưu.', 14800000.00, 1, N'NEW ARRIVAL', N'100% Italian Virgin Wool', N'Regular Tailored Fit', N'Lụa Cupro Mát Mịn', N'Khuy Gỗ Mun Khắc Logo', N'Atelier AURALIÈ'),

-- Danh mục 2: Váy & Đầm Dạ Hội
(5, N'Minimalist Silk Trench Dress', N'minimalist-silk-trench-dress', N'Đầm dạ hội phong cách Trench Dress may từ lụa tơ tằm nguyên chất với gam màu thanh lịch tôn vinh thần thái kiêu sa.', 18900000.00, 2, N'BESTSELLER', N'100% Lụa Tơ Tằm Tự Nhiên', N'Slim Evening Gown Cut', N'Chiffon Silk Thoáng Mát', N'Đai Lưng Mạ Vàng 18K', N'Atelier AURALIÈ Haute Couture'),
(6, N'Auralia Emerald Velvet Gown', N'auralia-emerald-velvet-gown', N'Đầm dạ hội chất liệu nhung ngọc lục bảo quý phái. Đường xẻ tà quyến rũ đính kết đá Swarovsky thủ công.', 21500000.00, 2, N'LIMITED', N'Nhung Lụa Pháp Thượng Hạng', N'Fitted Mermaid Silhouette', N'Lụa Habotai Siêu Mềm', N'Đá Swarovsky Áo', N'Atelier AURALIÈ'),
(7, N'Midnight Satin Evening Gown', N'midnight-satin-evening-gown', N'Đầm satin xanh đêm dạ tiệc Haute Couture với thiết kế tà váy lộng lẫy và chi tiết hở lưng thanh thoát.', 25000000.00, 2, N'EXCLUSIVE', N'Satin Duchesse Nhập Khẩu', N'Floor-Length Evening Cut', N'Lụa Lót Tơ Tằm', N'Dây Khóa Giọt Nước Vàng', N'Atelier AURALIÈ'),
(8, N'Chiffon Silk Cocktail Dress', N'chiffon-silk-cocktail-dress', N'Đầm cocktail lụa Chiffon dập ly mềm mại, uyển chuyển theo từng bước chân trong các buổi tiệc gala nhẹ nhàng.', 15500000.00, 2, N'NEW ARRIVAL', N'100% Chiffon Silk Lụa', N'A-Line Pleated Silhouette', N'Lớp Lót Lụa Dệt Tay', N'Khóa Kéo Ẩn Tinh Tế', N'Atelier AURALIÈ'),

-- Danh mục 3: Áo Khoác Thu Đông
(9, N'Oversized Cashmere Wool Sweater', N'oversized-cashmere-wool-sweater', N'Áo len dáng rộng dệt từ 100% sợi Cashmere nguyên chất siêu nhẹ, giữ ấm vượt trội trong mùa đông lạnh giá.', 8200000.00, 3, N'NEW ARRIVAL', N'100% Cashmere Sợi Đôi', N'Relaxed Oversized Fit', N'Không Lớp Lót (Dệt Liền)', N'Nhãn Da Bò Dập Chìm', N'Atelier AURALIÈ Winter Craft'),
(10, N'Midnight Navy Tailored Jacket', N'midnight-navy-tailored-jacket', N'Áo khoác dạ ngắn tông màu Navy hoàng gia chống nhăn và chống gió tuyệt đối cho các chuyến công du quốc tế.', 14200000.00, 3, N'BESTSELLER', N'Dạ Lông Cừu Dày Dặn', N'Modern Cropped Tailored', N'Lụa Cupro Thêu Chữ Ký', N'Khuy Bấm Mạ Vàng', N'Atelier AURALIÈ'),
(11, N'Alpine Cashmere Trench Coat', N'alpine-cashmere-trench-coat', N'Áo khoác dạ Măng-tô dáng dài hai hàng khuy kinh điển, đai thắt eo da bò thuộc tôn trọn vóc dáng thanh thoát.', 22800000.00, 3, N'LIMITED', N'100% Cashmere Thượng Hải', N'Long Trench Classic Cut', N'Lụa Satin Hai Mặt', N'Đai Khóa Da Bò & Mạ Vàng', N'Atelier AURALIÈ'),
(12, N'Double-Faced Wool Long Coat', N'double-faced-wool-long-coat', N'Áo khoác dạ hai mặt khâu tay không đường may lộ, tôn vinh kỹ thuật thủ công bậc thầy của thợ may Châu Âu.', 17900000.00, 3, N'EXCLUSIVE', N'Len Lông Cừu Hai Mặt', N'Straight Flowing Fit', N'Khâu Tay Liền Vải', N'Đai Buộc Len Đồng Chất', N'Atelier AURALIÈ'),

-- Danh mục 4: Túi Xách Da Cao Cấp
(13, N'Heritage Tan Leather Handbag', N'heritage-tan-leather-handbag', N'Túi xách da thuộc thảo mộc màu nâu di sản. Khóa xoay kim loại mạ vàng 18K khâu tay chỉ sáp tiêu chuẩn Atelier Ý.', 24000000.00, 4, N'BESTSELLER', N'Da Bò Thuộc Thảo Mộc Nappa', N'Structured Luxury Handbag', N'Da Cừu Siêu Mịn', N'Khóa Mạ Vàng 18K Chống Trầy', N'Chế Tác Thủ Công Tiêu Chuẩn Ý'),
(14, N'Monogram Ostrich Leather Tote', N'monogram-ostrich-leather-tote', N'Túi Tote da đà điểu tự nhiên khắc họa tiết Monogram độc quyền, ngăn chứa rộng rãi bọc da nhung êm ái.', 32500000.00, 4, N'LIMITED', N'Da Đà Điểu Nam Phi', N'Spacious Luxury Tote', N'Vải Nhung Đỏ Rượu Vang', N'Đinh Tán & Khóa Mạ Vàng', N'Atelier AURALIÈ Leathercraft'),
(15, N'Auralia Mini Flap Crossbody Bag', N'auralia-mini-flap-crossbody-bag', N'Túi đeo chéo nắp gập cỡ nhỏ thanh lịch với dây đeo kim loại phối da mềm, lý tưởng cho dạ tiệc nhẹ nhàng.', 18500000.00, 4, N'NEW ARRIVAL', N'Da Bê Hạt Mịn Caviar', N'Compact Flap Crossbody', N'Lót Da Bò Nappa', N'Khóa Logo AURALIÈ Mạ Vàng', N'Atelier AURALIÈ'),
(16, N'Crocodile Embossed Clutch', N'crocodile-embossed-clutch', N'Ví cầm tay Clutch dập vân cá sấu bóng bẩy, phom dáng cứng cáp giữ trọn phong thái quyền lực trên thảm đỏ.', 21000000.00, 4, N'EXCLUSIVE', N'Da Bò Ý Dập Vân Cá Sấu', N'Rigid Evening Clutch', N'Da Cừu Đen Tuyền', N'Khóa Bấm Nam Châm Ẩn Mạ Vàng', N'Atelier AURALIÈ'),

-- Danh mục 5: Giày & Phụ Kiện
(17, N'Royale Gold Buckle Boots', N'royale-gold-buckle-boots', N'Boots da bò cao cổ mũi nhọn kiêu hãnh với điểm nhấn khóa kim loại mạ vàng 18K và đế cao su chống trượt.', 15800000.00, 5, N'BESTSELLER', N'Da Bò Thuộc Mềm Mại', N'High Ankle Slim Fit', N'Lót Đệm Da Bò Êm Ái', N'Khóa Mạ Vàng 18K', N'Atelier AURALIÈ Shoes'),
(18, N'Handcrafted Calfskin Loafers', N'handcrafted-calfskin-loafers', N'Giày Loafer may thủ công từ da bê nguyên tấm màu đen bóng, cấu trúc đế may Goodyear Welted bền bỉ vĩnh cửu.', 11200000.00, 5, N'NEW ARRIVAL', N'Da Bê Ý Nhập Khẩu', N'European Classic Loafer', N'Lót Da Thuộc Khử Mùi', N'Chi Tiết Kim Loại Chống Rỉ', N'Atelier AURALIÈ'),
(19, N'18K Gold Plated Silk Scarf Ring', N'18k-gold-plated-silk-scarf-ring', N'Nhẫn cài khăn lụa mạ vàng 18K đính đá quý tinh tế, món phụ kiện hoàn hảo nâng tầm trang phục dạ hội.', 5500000.00, 5, N'EXCLUSIVE', N'Đồng Thau Mạ Vàng 18K', N'Universal Ring Fit', N'Hộp Gỗ Bọc Da Lót Nhung', N'Đá CZ Nhân Tạo Cắt Giác', N'Atelier AURALIÈ Accessories'),
(20, N'Classic Leather Stiletto Heels', N'classic-leather-stiletto-heels', N'Giày cao gót 9cm da thuộc bóng kiêu kỳ, thiết kế đế giày đỏ tạo điểm nhấn quyến rũ trong từng bước sải.', 13500000.00, 5, N'BESTSELLER', N'Da Bóng Patent Leather', N'9cm Stiletto Ergonomic Fit', N'Đệm Lót Bọt Khí Chống Mỏi', N'Gót Kim Loại Gia Cường', N'Atelier AURALIÈ');
SET IDENTITY_INSERT products OFF;
GO

-- 5. Product Variants (Biến thể kích cỡ, màu sắc và tồn kho)
SET IDENTITY_INSERT product_variants ON;
INSERT INTO product_variants (id, product_id, size, color, stock_quantity, variant_price, sku) VALUES
(1, 1, N'S', N'Đen Tuyền (Jet Black)', 8, 12500000.00, N'AUR-SUIT-S-BK'),
(2, 1, N'M', N'Đen Tuyền (Jet Black)', 15, 12500000.00, N'AUR-SUIT-M-BK'),
(3, 1, N'L', N'Đen Tuyền (Jet Black)', 10, 12500000.00, N'AUR-SUIT-L-BK'),
(4, 1, N'XL', N'Đen Tuyền (Jet Black)', 5, 12500000.00, N'AUR-SUIT-XL-BK'),
(5, 1, N'M', N'Vàng Hoàng Gia (Royal Gold)', 6, 12500000.00, N'AUR-SUIT-M-GD'),
(6, 1, N'L', N'Đỏ Đô (Burgundy)', 4, 12500000.00, N'AUR-SUIT-L-BG'),
(7, 5, N'S', N'Trắng Lụa (Silk White)', 6, 18900000.00, N'AUR-DRESS-S-WH'),
(8, 5, N'M', N'Trắng Lụa (Silk White)', 8, 18900000.00, N'AUR-DRESS-M-WH'),
(9, 5, N'L', N'Đỏ Ruby (Ruby Red)', 5, 18900000.00, N'AUR-DRESS-L-RD'),
(10, 13, N'FreeSize', N'Nâu Di Sản (Heritage Tan)', 12, 24000000.00, N'AUR-BAG-FS-TN'),
(11, 13, N'FreeSize', N'Đen Tuyền (Jet Black)', 8, 24000000.00, N'AUR-BAG-FS-BK'),
(12, 17, N'37', N'Đen Tuyền (Jet Black)', 6, 15800000.00, N'AUR-BOOTS-37-BK'),
(13, 17, N'38', N'Đen Tuyền (Jet Black)', 9, 15800000.00, N'AUR-BOOTS-38-BK'),
(14, 17, N'39', N'Đen Tuyền (Jet Black)', 5, 15800000.00, N'AUR-BOOTS-39-BK');
SET IDENTITY_INSERT product_variants OFF;
GO

-- 6. Product Images Gallery
SET IDENTITY_INSERT product_images ON;
INSERT INTO product_images (id, product_id, image_url, is_thumbnail) VALUES
(1, 1, N'assets/card_1.jpg', 1),
(2, 1, N'assets/card_2.jpg', 0),
(3, 1, N'assets/card_3.jpg', 0),
(4, 5, N'assets/card_2.jpg', 1),
(5, 13, N'assets/card_3.jpg', 1),
(6, 17, N'assets/card_4.jpg', 1);
SET IDENTITY_INSERT product_images OFF;
GO

-- 7. Orders (Các đơn hàng thực tế của khách hàng từ Admin Dashboard & Profile)
SET IDENTITY_INSERT orders ON;
INSERT INTO orders (id, user_id, order_code, total_amount, discount_amount, shipping_fee, shipping_address, phone_number, payment_method, payment_status, tracking_code, status, created_at) VALUES
(1, 2, N'AUR-2026-992', 18900000.00, 3000000.00, 0, N'Căn hộ 45.02, Tháp Landmark 81, Q.Bình Thạnh, TP.HCM', N'0908888999', N'VNPAY_QR', N'PAID', N'GHN-VN-99210088', N'SHIPPED', DATEADD(DAY, -2, GETDATE())),
(2, 3, N'AUR-2026-781', 18900000.00, 0, 0, N'Villa Golden River Aqua 1, Q.1, TP.HCM', N'0912345678', N'VISA', N'PAID', N'VNPOST-77123991', N'COMPLETED', DATEADD(DAY, -5, GETDATE())),
(3, 4, N'AUR-2026-554', 25000000.00, 1000000.00, 0, N'Khu Đô Thị Sala, TP.Thủ Đức, TP.HCM', N'0933112233', N'VISA', N'PAID', N'GHN-VN-55409122', N'PROCESSING', DATEADD(DAY, -1, GETDATE())),
(4, 5, N'AUR-2026-102', 12500000.00, 0, 0, N'Khu Biệt Thự Thảo Điền, Q.2, TP.HCM', N'0977665544', N'COD', N'UNPAID', N'GHN-VN-10287411', N'PENDING', GETDATE());
SET IDENTITY_INSERT orders OFF;
GO

-- 8. Order Items (Chi tiết sản phẩm trong đơn)
SET IDENTITY_INSERT order_items ON;
INSERT INTO order_items (id, order_id, variant_id, quantity, price) VALUES
(1, 1, 7, 1, 18900000.00), -- Đầm Minimalist Silk Trench Dress
(2, 2, 8, 1, 18900000.00), -- Áo khoác Alpine Cashmere Trench Coat
(3, 3, 10, 1, 24000000.00), -- Túi Heritage Tan Leather Handbag
(4, 4, 2, 1, 12500000.00);  -- Áo Vest Double-Breasted Tailored Suit
SET IDENTITY_INSERT order_items OFF;
GO

-- 9. Coupons (Mã giảm giá VIP AURALIÈ)
SET IDENTITY_INSERT coupons ON;
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, expiry_date, is_active) VALUES
(1, N'AURALIE2026', N'PERCENT', 20, 10000000.00, 3000000.00, 100, 14, DATEADD(MONTH, 6, GETDATE()), 1),
(2, N'WELCOME10', N'PERCENT', 10, 0, 1000000.00, 500, 48, DATEADD(MONTH, 3, GETDATE()), 1),
(3, N'FREESHIPLUX', N'FIXED', 100000.00, 5000000.00, 100000.00, 200, 29, DATEADD(MONTH, 12, GETDATE()), 1),
(4, N'VIPPLATINUM', N'PERCENT', 25, 15000000.00, 5000000.00, 50, 8, DATEADD(MONTH, 12, GETDATE()), 1);
SET IDENTITY_INSERT coupons OFF;
GO

-- 10. Product Reviews (Đánh giá thực tế từ khách hàng)
SET IDENTITY_INSERT product_reviews ON;
INSERT INTO product_reviews (id, product_id, user_name, user_email, rating, comment, variant_info, image_url, admin_reply, is_verified_buyer, helpful_count, created_at) VALUES
(1, 1, N'Nguyễn Thành Trung', N'trung.nguyen@gmail.com', 5, N'Áo vest may phom rất chuẩn, mặc lên đứng dáng và cực kỳ tôn vai. Vải len Cashmere mềm mịn, mặc thoáng mát không lo bị nóng. Đóng gói chỉn chu có cả móc treo bọc da xa xỉ.', N'Màu: Đen Tuyền | Kích cỡ: M', N'assets/card_1.jpg', N'Cảm ơn anh Trung đã tin chọn dòng sản phẩm may đo thủ công AURALIÈ Haute Couture. Chúc anh luôn phong độ và thành công!', 1, 18, DATEADD(DAY, -12, GETDATE())),
(2, 1, N'Lê Phương Anh', N'phuonganh.le@yahoo.com', 5, N'Mua làm quà tặng sinh nhật cho sếp. Sếp rất khen chất liệu và đường kim mũi chỉ tỉ mỉ. Nhân viên CSKH AURALIÈ gọi điện tư vấn size cực kỳ am hiểu thời trang.', N'Màu: Đen Tuyền | Kích cỡ: S', NULL, N'AURALIÈ rất vinh hạnh được đồng hành cùng chị Phương Anh trong món quà đặc biệt này!', 1, 12, DATEADD(DAY, -8, GETDATE())),
(3, 5, N'Phạm Hoàng My', N'hoangmy.pham@hotmail.com', 5, N'Đầm lụa sang trọng, xẻ tà quyến rũ thích hợp đi dạ tiệc thượng lưu. Chất lụa tơ tằm mềm mại như làn mây, mặc rất êm da.', N'Màu: Trắng Lụa | Kích cỡ: S', N'assets/card_2.jpg', NULL, 1, 9, DATEADD(DAY, -5, GETDATE())),
(4, 13, N'Trần Đình Trọng', N'trong.tran@outlook.com', 5, N'Túi da thuộc thủ công màu nâu rất sang trọng, khóa kim loại mạ vàng bóng bẩy không một tì vết.', N'Màu: Nâu Di Sản | Kích cỡ: FreeSize', N'assets/card_4.jpg', N'Cảm ơn anh Trọng đã dành lời khen ngợi cho tay nghề chế tác từ các nghệ nhân Atelier Ý của AURALIÈ!', 1, 7, DATEADD(DAY, -3, GETDATE())),
(5, 17, N'Nguyễn Thanh Vân', N'thanhvan.nguyen@gmail.com', 5, N'Boots da bò phom ôm chân vừa vặn, bước đi rất êm và tôn dáng. Khóa vàng 18K tạo điểm nhấn kiêu sa tuyệt đỉnh.', N'Màu: Đen Tuyền | Kích cỡ: 38', N'assets/card_5.jpg', N'Cảm ơn hội viên Platinum Nguyễn Thanh Vân luôn đồng hành cùng AURALIÈ!', 1, 14, DATEADD(DAY, -1, GETDATE()));
SET IDENTITY_INSERT product_reviews OFF;
GO

-- 11. Wishlists (Danh sách yêu thích)
SET IDENTITY_INSERT wishlists ON;
INSERT INTO wishlists (id, user_id, product_id, created_at) VALUES
(1, 2, 1, GETDATE()),
(2, 2, 5, GETDATE()),
(3, 3, 13, GETDATE()),
(4, 3, 17, GETDATE());
SET IDENTITY_INSERT wishlists OFF;
GO

-- 12. Blogs (Tạp chí thời trang AURALIÈ Gazette - Đầy đủ 6 bài viết)
SET IDENTITY_INSERT blogs ON;
INSERT INTO blogs (id, title, slug, category, summary, content, cover_image, author_name) VALUES
(1, N'AURALIÈ Autumn Runway 2026: Tuyên Ngôn Khái Niệm "Power Dressing" Hiện Đại', N'auralie-autumn-runway-2026-power-dressing', N'XU HƯỚNG', N'Bộ sưu tập Thu Đông 2026 đánh dấu sự lên ngôi của phom dáng cắt may kiến trúc Double-Breasted kết hợp lụa tơ tằm Mulberry thượng hạng.', N'Nội dung chi tiết bài viết phân tích tầm nhìn đằng sau những nếp gấp kiêu hãnh của giám đốc sáng tạo Elena Vũ...', N'assets/card_1.jpg', N'Elena Vũ (Giám Đốc Sáng Tạo)'),
(2, N'Hành Trình Dệt Nên Tấm Lụa Mulberry 100% Bảo Vật AURALIÈ', N'hanh-trinh-det-lua-mulberry-100', N'NGHỆ THUẬT CẮT MAY', N'Khám phá xưởng dệt thủ công lâu đời tại Ý, nơi mỗi sợi tơ tằm đều được tuyển chọn nghiêm ngặt qua 12 công đoạn tỉ mỉ.', N'Tại xưởng may Atelier AURALIÈ, mỗi tấm lụa tơ tằm nguyên bản được dệt theo mật độ sợi vàng để đạt được độ bóng mịn và rủ tự nhiên vĩnh cửu...', N'assets/card_2.jpg', N'Nghệ Nhân Dệt Lụa Atelier Ý'),
(3, N'5 Quy Tắc Vàng Giữ Đầm Lụa Haute Couture Luôn Như Mới', N'5-quy-tac-vang-cham-soc-dam-lua', N'BÍ QUYẾT PHONG CÁCH', N'Hướng dẫn giặt khô chuyên sâu, phương pháp bảo quản trong tủ gỗ tuyết tùng và cách là hơi nước chuẩn couture.', N'Để giữ cho đầm lụa luôn giữ được phom dáng và sắc thái kiêu sa, quý khách cần tuân thủ việc giặt khô chuyên dụng và tránh tiếp xúc trực tiếp ánh nắng gay gắt...', N'assets/card_3.jpg', N'Chuyên Gia Phục Chế Y Phục AURALIÈ'),
(4, N'Nghệ Thuật Chọn Phụ Kiện Kim Loại Mạ Vàng Nâng Tầm Suit Công Sở', N'nghe-thuat-chon-phu-kien-ma-vang', N'XU HƯỚNG', N'Điểm xuyết nút gài khăn lụa mạ vàng 18K để tạo điểm nhấn vừa thanh lịch vừa khẳng định gu thẩm mỹ tinh tế của nữ lãnh đạo.', N'Phụ kiện kim loại mạ vàng 18K không đơn thuần là trang sức, mà là điểm cân bằng hoàn mỹ cho những bộ âu phục mang sắc thái trầm mặc...', N'assets/card_4.jpg', N'Stylist Cao Cấp AURALIÈ'),
(5, N'Khám Phá Lounge May Đo Riêng Cho Thành Viên Platinum & Diamond', N'lounge-may-do-rieng-platinum-diamond', N'ĐẶC QUYỀN VIP', N'Không gian riêng tư sang trọng với sự hỗ trợ từ Stylist cá nhân và rượu Champagne Moët & Chandon thượng hạng.', N'Đặc quyền trải nghiệm không gian đo may độc bản tại tầng 45 Landmark 81 dành riêng cho hội viên VIP đẳng cấp nhất...', N'assets/card_5.jpg', N'Giám Đốc Dịch Vụ Khách Hàng VIP'),
(6, N'Bảng Màu Quiet Luxury: Sự Kết Hợp Giữa Tone Cream, Camel & Gold', N'bang-mau-quiet-luxury-cream-camel-gold', N'BÍ QUYẾT PHONG CÁCH', N'Cách lựa chọn sắc độ trang phục phù hợp với tông da Châu Á để toát lên khí chất quý phái không phô trương.', N'Phong cách Quiet Luxury năm 2026 khẳng định sự tối thượng của những gam màu trung tính sang trọng được dệt nên từ sợi tự nhiên nguyên chất...', N'assets/card_1.jpg', N'Nhà Thiết Kế Chính AURALIÈ');
SET IDENTITY_INSERT blogs OFF;
GO

-- 13. AI Chat Sessions (Phiên trợ lý AI Stylist)
SET IDENTITY_INSERT ai_chat_sessions ON;
INSERT INTO ai_chat_sessions (id, session_code, user_id, channel, status) VALUES
(1, N'SESS-AI-20261020-001', 2, N'WEB_WIDGET', N'ACTIVE');
SET IDENTITY_INSERT ai_chat_sessions OFF;
GO

-- 14. AI Chat Messages (Lịch sử trao đổi giữa khách và trợ lý AI)
SET IDENTITY_INSERT ai_chat_messages ON;
INSERT INTO ai_chat_messages (id, session_id, sender_type, message_text, attachment_type, intent_detected) VALUES
(1, 1, N'USER', N'Tư vấn giúp mình mẫu đầm đi dự gala dạ tiệc tối sang trọng với?', N'NONE', N'RECOMMEND_OUTFIT'),
(2, 1, N'AI_BOT', N'Dạ AURALIÈ xin chào chị Vân! Đối với dạ tiệc gala trang trọng, em trân trọng gợi ý mẫu Minimalist Silk Trench Dress phối cùng túi xách Heritage Tan Leather Handbag. Sự kết hợp này mang lại diện mạo kiêu sa và quyền lực tuyệt đối ạ.', N'NONE', N'RECOMMEND_OUTFIT');
SET IDENTITY_INSERT ai_chat_messages OFF;
GO

-- 15. AI Computer Vision Embeddings (Dữ liệu vector trích xuất từ ảnh)
SET IDENTITY_INSERT ai_image_embeddings ON;
INSERT INTO ai_image_embeddings (id, product_id, image_url, feature_vector_json, detected_category, confidence_score) VALUES
(1, 1, N'assets/card_1.jpg', N'[0.125, 0.942, 0.881, 0.003, 0.514, 0.778, 0.334, 0.651]', N'Áo Vest Double-Breasted Tailored', 98.60),
(2, 13, N'assets/card_4.jpg', N'[0.884, 0.112, 0.449, 0.912, 0.051, 0.228, 0.814, 0.199]', N'Túi Xách Da Thuộc Heritage Tan', 99.10);
SET IDENTITY_INSERT ai_image_embeddings OFF;
GO

-- 16. Abandoned Carts Recovery (Tiếp thị lại giỏ hàng bỏ quên)
SET IDENTITY_INSERT abandoned_carts ON;
INSERT INTO abandoned_carts (id, user_id, user_email, cart_data_json, coupon_code_offered, status) VALUES
(1, 2, N'thanhvan.nguyen@gmail.com', N'[{"id": 13, "name": "Heritage Tan Leather Handbag", "price": 24000000, "qty": 1}]', N'AURALIE2026', N'NOTIFIED');
SET IDENTITY_INSERT abandoned_carts OFF;
GO

-- 17. Inventory Batch Import Logs (Lịch sử nhập kho hàng loạt từ Admin Dashboard)
SET IDENTITY_INSERT inventory_imports ON;
INSERT INTO inventory_imports (id, batch_code, supplier_name, total_quantity, total_cost, imported_by, notes) VALUES
(1, N'IMP-BATCH-2026-001', N'Nhà Cung Cấp Milano Leather S.p.A (Ý)', 50, 450000000.00, N'Admin Executive', N'Nhập lô hàng len Cashmere và da thuộc thủ công BST Thu Đông 2026'),
(2, N'IMP-BATCH-2026-002', N'Atelier Da Thuộc Florence (Ý)', 100, 680000000.00, N'Admin Executive', N'Nhập da bê thuộc Nappa hảo hạng khâu túi xách và giày boots'),
(3, N'IMP-BATCH-2026-003', N'Xưởng Lụa Tơ Tằm Bảo Lộc (Việt Nam)', 200, 320000000.00, N'Admin Executive', N'Lụa tơ tằm Mulberry 100% nguyên bản dệt đầm dạ hội');
SET IDENTITY_INSERT inventory_imports OFF;
GO

-- 18. Payment Transactions (Giao dịch VNPAY, VISA, COD)
SET IDENTITY_INSERT payment_transactions ON;
INSERT INTO payment_transactions (id, transaction_code, order_id, payment_method, amount, gateway_response_code, status) VALUES
(1, N'VNPAY-TRANS-99882211', 1, N'VNPAY_QR', 18900000.00, N'00', N'SUCCESS'),
(2, N'VISA-TRANS-77112233', 2, N'VISA', 18900000.00, N'00', N'SUCCESS'),
(3, N'VISA-TRANS-55449911', 3, N'VISA', 25000000.00, N'00', N'SUCCESS');
SET IDENTITY_INSERT payment_transactions OFF;
GO

PRINT N'===================================================================';
PRINT N'>>> CHÚC MỪNG: ĐÃ KHỞI TẠO CSDL VÀ NẠP DỮ LIỆU MẪU SQL SERVER THÀNH CÔNG 100%!';
PRINT N'===================================================================';
GO

-- Kiểm tra tổng kết số dòng dữ liệu từng bảng
SELECT N'roles' AS TableName, COUNT(*) AS TotalRows FROM roles UNION ALL
SELECT N'users', COUNT(*) FROM users UNION ALL
SELECT N'categories', COUNT(*) FROM categories UNION ALL
SELECT N'products', COUNT(*) FROM products UNION ALL
SELECT N'product_variants', COUNT(*) FROM product_variants UNION ALL
SELECT N'orders', COUNT(*) FROM orders UNION ALL
SELECT N'order_items', COUNT(*) FROM order_items UNION ALL
SELECT N'coupons', COUNT(*) FROM coupons UNION ALL
SELECT N'product_reviews', COUNT(*) FROM product_reviews UNION ALL
SELECT N'blogs', COUNT(*) FROM blogs UNION ALL
SELECT N'payment_transactions', COUNT(*) FROM payment_transactions;
GO
