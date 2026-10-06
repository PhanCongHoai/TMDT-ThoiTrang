-- ===================================================================
-- AURALIÈ Haute Couture - Seed Data (Dữ liệu mẫu đồ án)
-- ===================================================================

-- 1. Thêm Roles
INSERT INTO roles (id, role_name) VALUES 
(1, 'ADMIN'),
(2, 'CUSTOMER')
ON CONFLICT DO NOTHING;

-- 2. Thêm 5 Danh mục sản phẩm
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Áo Vest & Blazer', 'vest-blazer', 'Bộ sưu tập áo vest và blazer tailored thiết kế thượng lưu Châu Âu'),
(2, 'Váy & Đầm Dạ Hội', 'vay-dam', 'Đầm lụa cao cấp, đầm dạ hội sang trọng quyến rũ'),
(3, 'Áo Khoác Thu Đông', 'ao-khoac', 'Áo khoác dạ măng-tô và len Cashmere Thu Đông'),
(4, 'Túi Xách Da Cao Cấp', 'tui-xach', 'Túi xách da thuộc thủ công và ví da cao cấp'),
(5, 'Giày & Phụ Kiện', 'giay-phu-kien', 'Giày boots, loafers da bò thật và phụ kiện mạ vàng')
ON CONFLICT DO NOTHING;

-- 3. Thêm 20 Sản phẩm cho 5 Danh mục (mỗi danh mục 4 sản phẩm)
INSERT INTO products (id, name, slug, description, base_price, category_id) VALUES
-- Áo Vest & Blazer
(1, 'Double-Breasted Tailored Suit', 'double-breasted-tailored-suit', 'Áo Vest may đo độc bản từ len Cashmere nhập khẩu Ý. Thiết kế Double-Breasted mang đến diện mạo quyền lực.', 12500000.00, 1),
(2, 'Black Blazer & High Boots Set', 'black-blazer-high-boots-set', 'Bộ Blazer đen huyền bí phối cùng boots cổ cao hiện đại. Điểm nhấn chiết eo thon gọn.', 16800000.00, 1),
(3, 'Royal Cashmere Velvet Tuxedo', 'royal-cashmere-velvet-tuxedo', 'Tuxedo nhung cao cấp phối ve áo lụa bóng. Dành riêng cho các buổi dạ tiệc Black Tie.', 19500000.00, 1),
(4, 'Italian Wool Tailored Blazer', 'italian-wool-tailored-blazer', 'Blazer may thủ công từ len cừu Ý cao cấp. Phom dáng công sở thượng lưu.', 14800000.00, 1),

-- Váy & Đầm Dạ Hội
(5, 'Minimalist Silk Trench Dress', 'minimalist-silk-trench-dress', 'Đầm dạ hội phong cách Trench Dress may từ lụa tơ tằm nguyên chất.', 18900000.00, 2),
(6, 'Auralia Emerald Velvet Gown', 'auralia-emerald-velvet-gown', 'Đầm dạ hội chất liệu nhung đỏ tuyền quyến rũ. Cổ xẻ sâu đính đá Swarovsky.', 21500000.00, 2),
(7, 'Midnight Satin Evening Gown', 'midnight-satin-evening-gown', 'Đầm satin xanh đêm dạ tiệc Haute Couture. Thiết kế tà váy dài lộng lẫy.', 25000000.00, 2),
(8, 'Chiffon Silk Cocktail Dress', 'chiffon-silk-cocktail-dress', 'Đầm cocktail lụa Chiffon xếp ly mềm mại cho các buổi tiệc gala.', 15500000.00, 2),

-- Áo Khoác Thu Đông
(9, 'Oversized Cashmere Wool Sweater', 'oversized-cashmere-wool-sweater', 'Áo len dáng rộng dệt từ 100% sợi Cashmere nguyên chất siêu nhẹ.', 8200000.00, 3),
(10, 'Midnight Navy Tailored Jacket', 'midnight-navy-tailored-jacket', 'Áo khoác dạ ngắn tông màu Navy chìm chống nhăn và giữ ấm tuyệt đối.', 14200000.00, 3),
(11, 'Alpine Cashmere Trench Coat', 'alpine-cashmere-trench-coat', 'Áo khoác dạ Măng-tô dáng dài Thượng Hải đai da bò thật.', 22800000.00, 3),
(12, 'Double-Faced Wool Long Coat', 'double-faced-wool-long-coat', 'Áo khoác dạ hai mặt thủ công mang vẻ đẹp vĩnh cửu Thu Đông.', 17900000.00, 3),

-- Túi Xách Da Cao Cấp
(13, 'Heritage Tan Leather Handbag', 'heritage-tan-leather-handbag', 'Túi xách da thuộc thủ công màu nâu di sản. Khóa mạ vàng 18K khâu tay tiêu chuẩn Ý.', 24000000.00, 4),
(14, 'Monogram Ostrich Leather Tote', 'monogram-ostrich-leather-tote', 'Túi Tote da đà điểu tự nhiên khắc họa tiết Monogram độc quyền.', 32500000.00, 4),
(15, 'Auralia Mini Flap Crossbody Bag', 'auralia-mini-flap-crossbody-bag', 'Túi đeo chéo nắp gập cỡ nhỏ nhỏ gọn sang trọng dây xích mạ vàng.', 18500000.00, 4),
(16, 'Crocodile Embossed Clutch', 'crocodile-embossed-clutch', 'Ví cầm tay Clutch da cá sấu cao cấp dự tiệc phom vuông vắn cứng cáp.', 21000000.00, 4),

-- Giày & Phụ Kiện
(17, 'Royale Gold Buckle Boots', 'royale-gold-buckle-boots', 'Boots da bò thật khóa mạ vàng 18K đế cao su chống trượt.', 15800000.00, 5),
(18, 'Handcrafted Calfskin Loafers', 'handcrafted-calfskin-loafers', 'Giày Loafer da bê may thủ công màu đen bóng thanh lịch.', 11200000.00, 5),
(19, '18K Gold Plated Silk Scarf Ring', '18k-gold-plated-silk-scarf-ring', 'Nhẫn cài khăn lụa mạ vàng 18K đính đá quý tinh tế.', 5500000.00, 5),
(20, 'Classic Leather Stiletto Heels', 'classic-leather-stiletto-heels', 'Giày cao gót 9cm da thuộc bóng kiêu kỳ phom dáng ôm chân chuẩn xác.', 13500000.00, 5)
ON CONFLICT DO NOTHING;

-- 4. Thêm Biến thể sản phẩm (Variants)
INSERT INTO product_variants (product_id, size, color, stock_quantity, variant_price, sku) VALUES
(1, 'S', 'Beige', 5, 12500000.00, 'AK-CASH-S-BE'),
(1, 'M', 'Beige', 8, 12500000.00, 'AK-CASH-M-BE'),
(1, 'L', 'Black', 3, 12500000.00, 'AK-CASH-L-BK'),
(5, 'S', 'Silk White', 4, 18900000.00, 'VD-SILK-S-WH'),
(13, 'F', 'Heritage Tan', 6, 24000000.00, 'TX-TAN-F-HN')
ON CONFLICT DO NOTHING;

-- 5. Thêm Đánh giá mẫu (Product Reviews Seed)
INSERT INTO product_reviews (product_id, user_name, user_email, rating, comment, variant_info, is_verified_buyer) VALUES
(1, 'Nguyễn Thành Trung', 'trung.nguyen@gmail.com', 5, 'Áo vest may phom rất chuẩn, mặc lên đứng dáng và cực kỳ tôn vai. Vải len Cashmere mềm mịn, mặc thoáng mát.', 'Màu: Đen Tuyền | Kích cỡ: M', TRUE),
(1, 'Lê Phương Anh', 'phuonganh.le@yahoo.com', 5, 'Mua làm quà tặng sinh nhật cho sếp. Sếp rất khen chất liệu và đường kim mũi chỉ tỉ mỉ.', 'Màu: Đen Tuyền | Kích cỡ: S', TRUE),
(5, 'Phạm Hoàng My', 'hoangmy.pham@hotmail.com', 5, 'Đầm lụa sang trọng, xẻ tà quyến rũ thích hợp đi dạ tiệc thượng lưu.', 'Màu: Đỏ Ruby | Kích cỡ: S', TRUE);


