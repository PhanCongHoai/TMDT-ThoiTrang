-- ===================================================================
-- AURALIÈ Haute Couture - Full Seed Data (Dữ liệu mẫu 100% cho Đồ án)
-- Tương thích PostgreSQL / MySQL / Supabase / Neon
-- ===================================================================

-- 1. Thêm Roles (Phân quyền)
INSERT INTO roles (id, role_name) VALUES 
(1, 'ADMIN'),
(2, 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

-- 2. Thêm Users (Quản trị viên & Khách hàng VIP thân thiết)
INSERT INTO users (id, full_name, email, password_hash, phone, address, role_id, vip_tier, vip_points, total_spent) VALUES
(1, 'Quản Trị Viên Executive', 'admin@auralie.fashion', '$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', '0909000111', 'Atelier AURALIÈ, 15 Đồng Khởi, Q.1, TP.HCM', 1, 'PLATINUM VIP', 9999, 500000000.00),
(2, 'Nguyễn Thanh Vân', 'thanhvan.nguyen@gmail.com', '$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', '0908888999', 'Căn hộ 45.02, Tháp Landmark 81, Q.Bình Thạnh, TP.HCM', 2, 'PLATINUM VIP', 2450, 125000000.00),
(3, 'Phạm Hoàng My', 'hoangmy.pham@hotmail.com', '$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', '0912345678', 'Villa Golden River Aqua 1, Q.1, TP.HCM', 2, 'GOLD VIP', 1350, 68500000.00),
(4, 'Trần Đình Trọng', 'trong.tran@outlook.com', '$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', '0933112233', 'Khu Đô Thị Sala, TP.Thủ Đức, TP.HCM', 2, 'SILVER VIP', 450, 24000000.00),
(5, 'Lê Bảo Long', 'long.le@gmail.com', '$2b$10$wB9L1yX50vHsqJ9lK8u2eO8XWp.vC7/U.BwQ58G78Z1jZg1cZk1kO', '0977665544', 'Khu Biệt Thự Thảo Điền, Q.2, TP.HCM', 2, 'SILVER VIP', 250, 12500000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Thêm 5 Danh mục sản phẩm thời trang xa xỉ
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Áo Vest & Blazer', 'vest-blazer', 'Bộ sưu tập áo vest và blazer tailored may đo chuẩn Châu Âu cho phong cách thượng lưu'),
(2, 'Váy & Đầm Dạ Hội', 'vay-dam', 'Đầm lụa tơ tằm, đầm dạ hội sang trọng kiêu sa đính đá quý thủ công'),
(3, 'Áo Khoác Thu Đông', 'ao-khoac', 'Áo khoác dạ măng-tô, áo choàng len Cashmere ấm áp và đẳng cấp'),
(4, 'Túi Xách Da Cao Cấp', 'tui-xach', 'Túi xách da bò thuộc Ý, da đà điểu và ví cầm tay khâu tay tinh xảo'),
(5, 'Giày & Phụ Kiện', 'giay-phu-kien', 'Boots da bò, Loafers da bê cao cấp và phụ kiện trang sức mạ vàng 18K')
ON CONFLICT (id) DO NOTHING;

-- 4. Thêm 20 Sản phẩm đặc trưng (4 sản phẩm mỗi danh mục)
INSERT INTO products (id, name, slug, description, base_price, category_id, tag) VALUES
-- Danh mục 1: Áo Vest & Blazer
(1, 'Double-Breasted Tailored Suit', 'double-breasted-tailored-suit', 'Áo Vest may đo độc bản từ len Cashmere nhập khẩu Ý. Thiết kế Double-Breasted mang đến diện mạo quyền lực chuẩn phom Châu Âu.', 12500000.00, 1, 'NEW ARRIVAL'),
(2, 'Black Blazer & High Boots Set', 'black-blazer-high-boots-set', 'Bộ Blazer đen huyền bí phối cùng boots cổ cao hiện đại. Điểm nhấn chiết eo thon gọn và đường cắt may thủ công tinh xảo.', 16800000.00, 1, 'BESTSELLER'),
(3, 'Royal Cashmere Velvet Tuxedo', 'royal-cashmere-velvet-tuxedo', 'Tuxedo nhung cao cấp phối ve áo lụa satin bóng. Trang phục hoàn hảo cho các đêm dạ tiệc Black Tie quý phái.', 19500000.00, 1, 'EXCLUSIVE'),
(4, 'Italian Wool Tailored Blazer', 'italian-wool-tailored-blazer', 'Blazer may thủ công từ len cừu Ý cao cấp. Phom dáng quyền lực dành riêng cho quý cô công sở thượng lưu.', 14800000.00, 1, 'NEW ARRIVAL'),

-- Danh mục 2: Váy & Đầm Dạ Hội
(5, 'Minimalist Silk Trench Dress', 'minimalist-silk-trench-dress', 'Đầm dạ hội phong cách Trench Dress may từ lụa tơ tằm nguyên chất với gam màu thanh lịch tôn vinh thần thái kiêu sa.', 18900000.00, 2, 'BESTSELLER'),
(6, 'Auralia Emerald Velvet Gown', 'auralia-emerald-velvet-gown', 'Đầm dạ hội chất liệu nhung đỏ tuyền quyến rũ. Đường xẻ tà quyến rũ đính kết đá Swarovsky thủ công lấp lánh.', 21500000.00, 2, 'LIMITED'),
(7, 'Midnight Satin Evening Gown', 'midnight-satin-evening-gown', 'Đầm satin xanh đêm dạ tiệc Haute Couture với thiết kế tà váy dài lộng lẫy và chi tiết hở lưng thanh thoát.', 25000000.00, 2, 'EXCLUSIVE'),
(8, 'Chiffon Silk Cocktail Dress', 'chiffon-silk-cocktail-dress', 'Đầm cocktail lụa Chiffon dập ly mềm mại, uyển chuyển theo từng bước chân trong các buổi tiệc gala nhẹ nhàng.', 15500000.00, 2, 'NEW ARRIVAL'),

-- Danh mục 3: Áo Khoác Thu Đông
(9, 'Oversized Cashmere Wool Sweater', 'oversized-cashmere-wool-sweater', 'Áo len dáng rộng dệt từ 100% sợi Cashmere nguyên chất siêu nhẹ, giữ ấm vượt trội trong mùa đông lạnh giá.', 8200000.00, 3, 'NEW ARRIVAL'),
(10, 'Midnight Navy Tailored Jacket', 'midnight-navy-tailored-jacket', 'Áo khoác dạ ngắn tông màu Navy hoàng gia chống nhăn và chống gió tuyệt đối cho các chuyến công du quốc tế.', 14200000.00, 3, 'BESTSELLER'),
(11, 'Alpine Cashmere Trench Coat', 'alpine-cashmere-trench-coat', 'Áo khoác dạ Măng-tô dáng dài hai hàng khuy kinh điển, đai thắt eo da bò thuộc tôn trọn vóc dáng thanh thoát.', 22800000.00, 3, 'LIMITED'),
(12, 'Double-Faced Wool Long Coat', 'double-faced-wool-long-coat', 'Áo khoác dạ hai mặt khâu tay không đường may lộ, tôn vinh kỹ thuật thủ công bậc thầy của thợ may Châu Âu.', 17900000.00, 3, 'EXCLUSIVE'),

-- Danh mục 4: Túi Xách Da Cao Cấp
(13, 'Heritage Tan Leather Handbag', 'heritage-tan-leather-handbag', 'Túi xách da thuộc thảo mộc màu nâu di sản. Khóa xoay kim loại mạ vàng 18K khâu tay chỉ sáp tiêu chuẩn Atelier Ý.', 24000000.00, 4, 'BESTSELLER'),
(14, 'Monogram Ostrich Leather Tote', 'monogram-ostrich-leather-tote', 'Túi Tote da đà điểu tự nhiên khắc họa tiết Monogram độc quyền, ngăn chứa rộng rãi bọc da nhung êm ái.', 32500000.00, 4, 'LIMITED'),
(15, 'Auralia Mini Flap Crossbody Bag', 'auralia-mini-flap-crossbody-bag', 'Túi đeo chéo nắp gập cỡ nhỏ thanh lịch với dây đeo kim loại phối da mềm, lý tưởng cho dạ tiệc nhẹ nhàng.', 18500000.00, 4, 'NEW ARRIVAL'),
(16, 'Crocodile Embossed Clutch', 'crocodile-embossed-clutch', 'Ví cầm tay Clutch dập vân cá sấu bóng bẩy, phom dáng cứng cáp giữ trọn phong thái quyền lực trên thảm đỏ.', 21000000.00, 4, 'EXCLUSIVE'),

-- Danh mục 5: Giày & Phụ Kiện
(17, 'Royale Gold Buckle Boots', 'royale-gold-buckle-boots', 'Boots da bò cao cổ mũi nhọn kiêu hãnh với điểm nhấn khóa kim loại mạ vàng 18K và đế cao su chống trượt.', 15800000.00, 5, 'BESTSELLER'),
(18, 'Handcrafted Calfskin Loafers', 'handcrafted-calfskin-loafers', 'Giày Loafer may thủ công từ da bê nguyên tấm màu đen bóng, cấu trúc đế may Goodyear Welted bền bỉ vĩnh cửu.', 11200000.00, 5, 'NEW ARRIVAL'),
(19, '18K Gold Plated Silk Scarf Ring', '18k-gold-plated-silk-scarf-ring', 'Nhẫn cài khăn lụa mạ vàng 18K đính đá quý tinh tế, món phụ kiện hoàn hảo nâng tầm trang phục dạ hội.', 5500000.00, 5, 'EXCLUSIVE'),
(20, 'Classic Leather Stiletto Heels', 'classic-leather-stiletto-heels', 'Giày cao gót 9cm da thuộc bóng kiêu kỳ, thiết kế đế giày đỏ tạo điểm nhấn quyến rũ trong từng bước sải.', 13500000.00, 5, 'BESTSELLER'),

-- Danh mục 1 bổ sung (IDs 21-26)
(21, 'Ivory Satin Peak-Lapel Blazer', 'ivory-satin-peak-lapel-blazer', 'Áo Blazer lụa satin màu ngà với thiết kế ve nhọn Peak-Lapel hoàng gia, mang lại vẻ thanh lịch và quyền quý tuyệt đối.', 15500000.00, 1, 'NEW ARRIVAL'),
(22, 'Midnight Navy Pinstripe Suit', 'midnight-navy-pinstripe-suit', 'Bộ Suit kẻ sọc Pinstripe xanh navy cổ điển, may từ sợi lông cừu Merino Super 150s mềm mượt cho quý ông thành đạt.', 18200000.00, 1, 'EXCLUSIVE'),
(23, 'Burgundy Velvet Evening Tuxedo', 'burgundy-velvet-evening-tuxedo', 'Tuxedo nhung đỏ rượu vang Burgundy quý phái, phối ve sam cổ điển bọc lụa đen huyền thoại cho đêm dạ tiệc gala.', 21000000.00, 1, 'LIMITED'),
(24, 'Double-Breasted Houndstooth Blazer', 'double-breasted-houndstooth-blazer', 'Áo Blazer họa tiết nanh sói Houndstooth đen trắng kinh điển, thiết kế 6 khuy đôi tôn dáng chuẩn phom Châu Âu.', 16500000.00, 1, 'BESTSELLER'),
(25, 'Charcoal Grey Virgin Wool Suit', 'charcoal-grey-virgin-wool-suit', 'Bộ Suit màu xám than lịch lãm dệt từ 100% Virgin Wool nhập khẩu vùng Biella nước Ý, chống nhăn và thoáng khí tối ưu.', 17800000.00, 1, 'NEW ARRIVAL'),
(26, 'Emerald Silk Jacquard Tuxedo', 'emerald-silk-jacquard-tuxedo', 'Áo Tuxedo gấm lụa Jacquard màu ngọc lục bảo dệt nổi hoa văn hoàng gia, khẳng định đẳng cấp xa xỉ tại các sự kiện thượng lưu.', 23500000.00, 1, 'EXCLUSIVE'),

-- Danh mục 2 bổ sung (IDs 27-32)
(27, 'Royal Scarlet Silk Mermaid Gown', 'royal-scarlet-silk-mermaid-gown', 'Đầm dạ hội đuôi cá màu đỏ Scarlet lộng lẫy bằng lụa Satin Duchesse, tà váy xòe tự nhiên tôn trọn đường cong quyến rũ.', 26800000.00, 2, 'LIMITED'),
(28, 'Champagne Crystal Plissé Dress', 'champagne-crystal-plisse-dress', 'Đầm dạ tiệc màu Champagne dập ly Plissé đính kết pha lê Swarovski thủ công quanh cổ áo và eo, tỏa sáng kiêu sa.', 22500000.00, 2, 'BESTSELLER'),
(29, 'Noir One-Shoulder Crepe Gown', 'noir-one-shoulder-crepe-gown', 'Đầm dạ hội lệch vai màu đen tuyền Noir may từ lụa Crepe cao cấp của Pháp, điểm nhấn xẻ tà cao kiêu kỳ và bí ẩn.', 19800000.00, 2, 'NEW ARRIVAL'),
(30, 'Sapphire Blue Off-Shoulder Gown', 'sapphire-blue-off-shoulder-gown', 'Đầm dạ tiệc trễ vai xanh ngọc Sapphire lộng lẫy, chất liệu lụa Mikado dày dặn đứng phom tạo vẻ uy quyền quý phái.', 24000000.00, 2, 'EXCLUSIVE'),
(31, 'Pearl White Backless Silk Dress', 'pearl-white-backless-silk-dress', 'Đầm lụa trắng ngọc trai hở lưng chữ V quyến rũ, thiết kế tối giản thanh lịch vượt thời gian cho những buổi tiệc tối sang trọng.', 21200000.00, 2, 'BESTSELLER'),
(32, 'Rose Gold Metallic Pleated Gown', 'rose-gold-metallic-pleated-gown', 'Đầm dạ hội ánh kim vàng hồng Rose Gold dập ly toàn thân lấp lánh dưới ánh đèn vũ hội, tôn vinh thần thái nữ vương.', 27500000.00, 2, 'LIMITED'),

-- Danh mục 3 bổ sung (IDs 33-38)
(33, 'Camel Belted Wool Wrap Coat', 'camel-belted-wool-wrap-coat', 'Áo khoác dạ thắt đai màu nâu Camel kinh điển, dệt từ len lông cừu nguyên chất giữ ấm hoàn hảo với phom dáng mềm mại quý phái.', 23500000.00, 3, 'BESTSELLER'),
(34, 'Oatmeal Cashmere Turtleneck Poncho', 'oatmeal-cashmere-turtleneck-poncho', 'Áo choàng Poncho cổ lọ màu yến mạch Oatmeal đan từ 100% Cashmere Mông Cổ siêu nhẹ, tạo nét phóng khoáng đầy thượng lưu.', 16800000.00, 3, 'NEW ARRIVAL'),
(35, 'Black Shearling Leather Biker Jacket', 'black-shearling-leather-biker-jacket', 'Áo khoác da cừu lót lông Shearling cao cấp màu đen bóng, thiết kế Biker cá tính giữ ấm tuyệt đối trong mùa băng giá.', 29000000.00, 3, 'EXCLUSIVE'),
(36, 'Houndstooth Wool Trench Coat', 'houndstooth-wool-trench-coat', 'Áo măng tô dạ họa tiết nanh sói Houndstooth dáng dài hai hàng khuy, ve áo bản to sang trọng chuẩn phong cách quý tộc Anh Quốc.', 25500000.00, 3, 'NEW ARRIVAL'),
(37, 'Monochrome Quilted Down Parka', 'monochrome-quilted-down-parka', 'Áo phao lông vũ ngỗng trắng dáng dài phong cách Monochrome siêu nhẹ, chống gió và chống nước tối ưu cho các chuyến du lịch tuyết.', 19500000.00, 3, 'BESTSELLER'),
(38, 'Ivory Double-Breasted Peacoat', 'ivory-double-breasted-peacoat', 'Áo khoác Peacoat dạ ngắn màu ngà Ivory hai hàng khuy mạ vàng, mang lại vẻ trẻ trung, năng động nhưng không kém phần đẳng cấp.', 17500000.00, 3, 'LIMITED'),

-- Danh mục 4 bổ sung (IDs 39-44)
(39, 'Burgundy Croc-Effect Kelly Bag', 'burgundy-croc-effect-kelly-bag', 'Túi xách phom dáng Kelly màu đỏ rượu vang dập vân cá sấu bóng mờ, quai xách tay cứng cáp cùng khóa xoay kim loại mạ vàng 18K.', 28500000.00, 4, 'LIMITED'),
(40, 'Noir Quilted Lambskin Flap Bag', 'noir-quilted-lambskin-flap-bag', 'Túi đeo chéo nắp gập chần bông quả trám da cừu non Lambskin siêu mềm, dây xích luồn da kim loại vàng sang trọng vượt thời gian.', 26000000.00, 4, 'BESTSELLER'),
(41, 'Taupe Grained Calfskin Tote', 'taupe-grained-calfskin-tote', 'Túi Tote da bê hạt màu xám Taupe thanh lịch, ngăn chứa rộng đựng vừa laptop 14 inch, hoàn hảo cho quý cô công sở bận rộn.', 23000000.00, 4, 'NEW ARRIVAL'),
(42, 'Emerald Velvet Evening Minaudière', 'emerald-velvet-evening-minaudiere', 'Ví dạ tiệc Minaudière hình hộp bọc nhung ngọc lục bảo viền kim loại mạ vàng đính đá, phụ kiện thảm đỏ hoàn mỹ cho quý bà.', 19500000.00, 4, 'EXCLUSIVE'),
(43, 'Caramel Saddle Leather Shoulder Bag', 'caramel-saddle-leather-shoulder-bag', 'Túi đeo vai phom yên ngựa Saddle màu nâu Caramel cổ điển, đường chỉ viền khâu tay thủ công bằng sáp ong bền bỉ trọn đời.', 21500000.00, 4, 'NEW ARRIVAL'),
(44, 'Ivory Lizard-Embossed Baguette', 'ivory-lizard-embossed-baguette', 'Túi kẹp nách Baguette da dập vân kỳ đà màu trắng ngà Ivory tinh tế, phong cách Y2K thời thượng kết hợp nét cổ điển Haute Couture.', 20000000.00, 4, 'BESTSELLER'),

-- Danh mục 5 bổ sung (IDs 45-50)
(45, 'Crystal Embellished Satin Pumps', 'crystal-embellished-satin-pumps', 'Giày cao gót 8cm lụa satin đính cài bông hoa pha lê lấp lánh ở mũi giày, kiệt tác giày cưới và dạ tiệc hoàng gia.', 16500000.00, 5, 'LIMITED'),
(46, 'Cognac Chelsea Boots Calfskin', 'cognac-chelsea-boots-calfskin', 'Giày bốt Chelsea da bê màu nâu Cognac may thủ công, thun co giãn hai bên tiện lợi cùng đế cao su đúc nguyên khối chống trượt.', 14800000.00, 5, 'BESTSELLER'),
(47, '24K Gold Monogram Silk Scarf', '24k-gold-monogram-silk-scarf', 'Khăn choàng lụa tơ tằm dệt tay 90x90cm in họa tiết Monogram dát ánh kim vàng 24K, viền khăn cuộn mép thủ công tinh tế.', 6800000.00, 5, 'NEW ARRIVAL'),
(48, 'Black Suede Knee-High Boots', 'black-suede-knee-high-boots', 'Giày bốt da lộn cổ cao dưới đầu gối màu đen tuyền, gót trụ 7cm vững chãi tôn đôi chân thon dài quyến rũ trong mùa lễ hội.', 18500000.00, 5, 'EXCLUSIVE'),
(49, 'Bespoke 18K Gold Cufflinks Pair', 'bespoke-18k-gold-cufflinks-pair', 'Cặp khuy măng sét mạ vàng 18K khảm xà cừ tự nhiên chạm khắc logo AURALIÈ độc bản, mảnh ghép hoàn hảo cho áo sơ mi may đo.', 7200000.00, 5, 'NEW ARRIVAL'),
(50, 'Burgundy Patent Strappy Sandals', 'burgundy-patent-strappy-sandals', 'Sandal cao gót 9cm quai mảnh da bóng màu đỏ mận Burgundy, tôn vinh đôi bàn chân ngọc ngà trong các đêm tiệc mùa hè và thu đông.', 13900000.00, 5, 'BESTSELLER')
ON CONFLICT (id) DO NOTHING;

-- 5. Thêm Biến thể sản phẩm (Size, Color, Tồn kho, SKU)
INSERT INTO product_variants (id, product_id, size, color, stock_quantity, variant_price, sku) VALUES
(1, 1, 'S', 'Đen Tuyền (Jet Black)', 8, 12500000.00, 'AUR-SUIT-S-BK'),
(2, 1, 'M', 'Đen Tuyền (Jet Black)', 15, 12500000.00, 'AUR-SUIT-M-BK'),
(3, 1, 'L', 'Đen Tuyền (Jet Black)', 10, 12500000.00, 'AUR-SUIT-L-BK'),
(4, 1, 'M', 'Vàng Hoàng Gia (Royal Gold)', 6, 12500000.00, 'AUR-SUIT-M-GD'),
(5, 5, 'S', 'Trắng Lụa (Silk White)', 6, 18900000.00, 'AUR-DRESS-S-WH'),
(6, 5, 'M', 'Trắng Lụa (Silk White)', 8, 18900000.00, 'AUR-DRESS-M-WH'),
(7, 5, 'L', 'Đỏ Ruby (Ruby Red)', 5, 18900000.00, 'AUR-DRESS-L-RD'),
(8, 11, 'M', 'Nâu Lạc Đà (Camel)', 7, 22800000.00, 'AUR-COAT-M-CM'),
(9, 13, 'FreeSize', 'Nâu Di Sản (Heritage Tan)', 12, 24000000.00, 'AUR-BAG-FS-TN'),
(10, 13, 'FreeSize', 'Đen Tuyền (Jet Black)', 8, 24000000.00, 'AUR-BAG-FS-BK'),
(11, 17, '37', 'Đen Tuyền (Jet Black)', 6, 15800000.00, 'AUR-BOOTS-37-BK'),
(12, 17, '38', 'Đen Tuyền (Jet Black)', 9, 15800000.00, 'AUR-BOOTS-38-BK'),
(13, 17, '39', 'Đen Tuyền (Jet Black)', 5, 15800000.00, 'AUR-BOOTS-39-BK')
ON CONFLICT (id) DO NOTHING;

-- 6. Thêm Hình Ảnh Sản Phẩm (Product Images Gallery)
INSERT INTO product_images (id, product_id, image_url, is_thumbnail) VALUES
(1, 1, 'assets/card_1.jpg', TRUE),
(2, 2, 'assets/card_5.jpg', TRUE),
(3, 3, 'assets/card_1.jpg', TRUE),
(4, 5, 'assets/card_2.jpg', TRUE),
(5, 9, 'assets/card_3.jpg', TRUE),
(6, 10, 'assets/card_6.jpg', TRUE),
(7, 13, 'assets/card_4.jpg', TRUE),
(8, 17, 'assets/card_5.jpg', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Thêm Đơn Hàng Mẫu (Orders từ Admin Dashboard & Khách VIP)
INSERT INTO orders (id, user_id, order_code, total_amount, discount_amount, shipping_fee, shipping_address, phone_number, payment_method, payment_status, tracking_code, status, created_at) VALUES
(1, 2, 'AUR-2026-992', 18900000.00, 3000000.00, 0, 'Căn hộ 45.02, Tháp Landmark 81, Q.Bình Thạnh, TP.HCM', '0908888999', 'VNPAY_QR', 'PAID', 'GHN-VN-99210088', 'SHIPPED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, 'AUR-2026-781', 18900000.00, 0, 0, 'Villa Golden River Aqua 1, Q.1, TP.HCM', '0912345678', 'VISA', 'PAID', 'VNPOST-77123991', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 4, 'AUR-2026-554', 25000000.00, 1000000.00, 0, 'Khu Đô Thị Sala, TP.Thủ Đức, TP.HCM', '0933112233', 'VISA', 'PAID', 'GHN-VN-55409122', 'PROCESSING', CURRENT_TIMESTAMP - INTERVAL '1 days'),
(4, 5, 'AUR-2026-102', 12500000.00, 0, 0, 'Khu Biệt Thự Thảo Điền, Q.2, TP.HCM', '0977665544', 'COD', 'UNPAID', 'GHN-VN-10287411', 'PENDING', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 8. Thêm Chi Tiết Đơn Hàng (Order Items)
INSERT INTO order_items (id, order_id, variant_id, quantity, price) VALUES
(1, 1, 5, 1, 18900000.00), -- Minimalist Silk Trench Dress
(2, 2, 8, 1, 18900000.00), -- Alpine Cashmere Trench Coat
(3, 3, 9, 1, 24000000.00), -- Heritage Tan Leather Handbag
(4, 4, 2, 1, 12500000.00)  -- Double-Breasted Tailored Suit
ON CONFLICT (id) DO NOTHING;

-- 9. Thêm Mã Giảm Giá VIP (Coupons & Vouchers)
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, expiry_date, is_active) VALUES
(1, 'AURALIE2026', 'PERCENT', 20, 10000000.00, 3000000.00, 100, 14, CURRENT_TIMESTAMP + INTERVAL '180 days', TRUE),
(2, 'WELCOME10', 'PERCENT', 10, 0, 1000000.00, 500, 48, CURRENT_TIMESTAMP + INTERVAL '90 days', TRUE),
(3, 'FREESHIPLUX', 'FIXED', 100000.00, 5000000.00, 100000.00, 200, 29, CURRENT_TIMESTAMP + INTERVAL '365 days', TRUE),
(4, 'VIPPLATINUM', 'PERCENT', 25, 15000000.00, 5000000.00, 50, 8, CURRENT_TIMESTAMP + INTERVAL '365 days', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 10. Thêm Đánh Giá Khách Hàng (Product Reviews kèm Admin Reply)
INSERT INTO product_reviews (id, product_id, user_name, user_email, rating, comment, variant_info, image_url, admin_reply, is_verified_buyer, created_at) VALUES
(1, 1, 'Nguyễn Thành Trung', 'trung.nguyen@gmail.com', 5, 'Áo vest may phom rất chuẩn, mặc lên đứng dáng và cực kỳ tôn vai. Vải len Cashmere mềm mịn, mặc thoáng mát không lo bị nóng. Đóng gói chỉn chu có móc treo da xa xỉ.', 'Màu: Đen Tuyền | Kích cỡ: M', 'assets/card_1.jpg', 'AURALIÈ chân thành cảm ơn anh Trung đã tin chọn dòng sản phẩm may đo thủ công. Chúc anh luôn phong độ và thành công!', TRUE, CURRENT_TIMESTAMP - INTERVAL '12 days'),
(2, 1, 'Lê Phương Anh', 'phuonganh.le@yahoo.com', 5, 'Mua làm quà tặng sinh nhật cho sếp. Sếp rất khen chất liệu và đường kim mũi chỉ tỉ mỉ. Nhân viên CSKH AURALIÈ gọi điện tư vấn size cực kỳ am hiểu thời trang.', 'Màu: Đen Tuyền | Kích cỡ: S', NULL, 'AURALIÈ rất vinh hạnh được đồng hành cùng chị Phương Anh trong món quà đặc biệt này!', TRUE, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(3, 5, 'Phạm Hoàng My', 'hoangmy.pham@hotmail.com', 5, 'Đầm lụa sang trọng, xẻ tà quyến rũ thích hợp đi dạ tiệc thượng lưu. Chất lụa tơ tằm mềm mại như làn mây, mặc rất êm da.', 'Màu: Trắng Lụa | Kích cỡ: S', 'assets/card_2.jpg', NULL, TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 13, 'Trần Đình Trọng', 'trong.tran@outlook.com', 5, 'Túi da thuộc thủ công màu nâu rất sang trọng, khóa kim loại mạ vàng bóng bẩy không một tì vết.', 'Màu: Nâu Di Sản | Kích cỡ: FreeSize', 'assets/card_4.jpg', 'Cảm ơn anh Trọng đã dành lời khen ngợi cho tay nghề chế tác từ các nghệ nhân Atelier Ý của AURALIÈ!', TRUE, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(5, 17, 'Nguyễn Thanh Vân', 'thanhvan.nguyen@gmail.com', 5, 'Boots da bò phom ôm chân vừa vặn, bước đi rất êm và tôn dáng. Khóa vàng 18K tạo điểm nhấn kiêu sa tuyệt đỉnh.', 'Màu: Đen Tuyền | Kích cỡ: 38', 'assets/card_5.jpg', 'Cảm ơn hội viên Platinum Nguyễn Thanh Vân luôn đồng hành cùng AURALIÈ!', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- 11. Thêm Danh Sách Yêu Thích (Wishlists)
INSERT INTO wishlists (id, user_id, product_id, created_at) VALUES
(1, 2, 1, CURRENT_TIMESTAMP),
(2, 2, 5, CURRENT_TIMESTAMP),
(3, 3, 13, CURRENT_TIMESTAMP),
(4, 3, 17, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 12. Thêm Toàn Bộ 6 Bài Viết Tạp Chí AURALIÈ Gazette (Blogs từ blog.html)
INSERT INTO blogs (id, title, slug, category, summary, content, cover_image, author_name) VALUES
(1, 'AURALIÈ Autumn Runway 2026: Tuyên Ngôn Khái Niệm "Power Dressing" Hiện Đại', 'auralie-autumn-runway-2026-power-dressing', 'XU HƯỚNG', 'Bộ sưu tập Thu Đông 2026 đánh dấu sự lên ngôi của phom dáng cắt may kiến trúc Double-Breasted kết hợp lụa tơ tằm Mulberry thượng hạng.', 'Nội dung chi tiết bài viết phân tích tầm nhìn đằng sau những nếp gấp kiêu hãnh của giám đốc sáng tạo Elena Vũ...', 'assets/card_1.jpg', 'Elena Vũ (Giám Đốc Sáng Tạo)'),
(2, 'Hành Trình Dệt Nên Tấm Lụa Mulberry 100% Bảo Vật AURALIÈ', 'hanh-trinh-det-lua-mulberry-100', 'NGHỆ THUẬT CẮT MAY', 'Khám phá xưởng dệt thủ công lâu đời tại Ý, nơi mỗi sợi tơ tằm đều được tuyển chọn nghiêm ngặt qua 12 công đoạn tỉ mỉ.', 'Tại xưởng may Atelier AURALIÈ, mỗi tấm lụa tơ tằm nguyên bản được dệt theo mật độ sợi vàng để đạt được độ bóng mịn và rủ tự nhiên vĩnh cửu...', 'assets/card_2.jpg', 'Nghệ Nhân Dệt Lụa Atelier Ý'),
(3, '5 Quy Tắc Vàng Giữ Đầm Lụa Haute Couture Luôn Như Mới', '5-quy-tac-vang-cham-soc-dam-lua', 'BÍ QUYẾT PHONG CÁCH', 'Hướng dẫn giặt khô chuyên sâu, phương pháp bảo quản trong tủ gỗ tuyết tùng và cách là hơi nước chuẩn couture.', 'Để giữ cho đầm lụa luôn giữ được phom dáng và sắc thái kiêu sa, quý khách cần tuân thủ việc giặt khô chuyên dụng và tránh tiếp xúc trực tiếp ánh nắng gay gắt...', 'assets/card_3.jpg', 'Chuyên Gia Phục Chế Y Phục AURALIÈ'),
(4, 'Nghệ Thuật Chọn Phụ Kiện Kim Loại Mạ Vàng Nâng Tầm Suit Công Sở', 'nghe-thuat-chon-phu-kien-ma-vang', 'XU HƯỚNG', 'Điểm xuyết nút gài khăn lụa mạ vàng 18K để tạo điểm nhấn vừa thanh lịch vừa khẳng định gu thẩm mỹ tinh tế của nữ lãnh đạo.', 'Phụ kiện kim loại mạ vàng 18K không đơn thuần là trang sức, mà là điểm cân bằng hoàn mỹ cho những bộ âu phục mang sắc thái trầm mặc...', 'assets/card_4.jpg', 'Stylist Cao Cấp AURALIÈ'),
(5, 'Khám Phá Lounge May Đo Riêng Cho Thành Viên Platinum & Diamond', 'lounge-may-do-rieng-platinum-diamond', 'ĐẶC QUYỀN VIP', 'Không gian riêng tư sang trọng với sự hỗ trợ từ Stylist cá nhân và rượu Champagne Moët & Chandon thượng hạng.', 'Đặc quyền trải nghiệm không gian đo may độc bản tại tầng 45 Landmark 81 dành riêng cho hội viên VIP đẳng cấp nhất...', 'assets/card_5.jpg', 'Giám Đốc Dịch Vụ Khách Hàng VIP'),
(6, 'Bảng Màu Quiet Luxury: Sự Kết Hợp Giữa Tone Cream, Camel & Gold', 'bang-mau-quiet-luxury-cream-camel-gold', 'BÍ QUYẾT PHONG CÁCH', 'Cách lựa chọn sắc độ trang phục phù hợp với tông da Châu Á để toát lên khí chất quý phái không phô trương.', 'Phong cách Quiet Luxury năm 2026 khẳng định sự tối thượng của những gam màu trung tính sang trọng được dệt nên từ sợi tự nhiên nguyên chất...', 'assets/card_1.jpg', 'Nhà Thiết Kế Chính AURALIÈ')
ON CONFLICT (id) DO NOTHING;

-- 13. Thêm Phiên Chat AI Stylist (AI Chat Sessions)
INSERT INTO ai_chat_sessions (id, session_code, user_id, channel, status) VALUES
(1, 'SESS-AI-20261020-001', 2, 'WEB_WIDGET', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 14. Thêm Tin Nhắn Trợ Lý AI Stylist (AI Chat Messages)
INSERT INTO ai_chat_messages (id, session_id, sender_type, message_text, attachment_type, intent_detected) VALUES
(1, 1, 'USER', 'Tư vấn giúp mình mẫu đầm đi dự dạ tiệc tối sang trọng với?', 'NONE', 'RECOMMEND_OUTFIT'),
(2, 1, 'AI_BOT', 'Chào chị Vân! Đối với dạ tiệc sang trọng, em gợi ý mẫu Minimalist Silk Trench Dress phối cùng túi xách Heritage Tan Leather Handbag.', 'NONE', 'RECOMMEND_OUTFIT')
ON CONFLICT (id) DO NOTHING;

-- 15. Thêm Vector AI Phân Tích Hình Ảnh (AI Computer Vision Embedding)
INSERT INTO ai_image_embeddings (id, product_id, image_url, feature_vector_json, detected_category, confidence_score) VALUES
(1, 1, 'assets/card_1.jpg', '[0.125, 0.942, 0.881, 0.003, 0.514, 0.778, 0.334, 0.651]', 'Áo Vest Double-Breasted Tailored', 98.60),
(2, 13, 'assets/card_4.jpg', '[0.884, 0.112, 0.449, 0.912, 0.051, 0.228, 0.814, 0.199]', 'Túi Xách Da Thuộc Heritage Tan', 99.10)
ON CONFLICT (id) DO NOTHING;

-- 16. Thêm Giỏ Hàng Bỏ Quên Cần Tiếp Thị Lại (Abandoned Carts Recovery)
INSERT INTO abandoned_carts (id, user_id, user_email, cart_data_json, coupon_code_offered, status) VALUES
(1, 2, 'thanhvan.nguyen@gmail.com', '[{"id": 13, "name": "Heritage Tan Leather Handbag", "price": 24000000, "qty": 1}]', 'AURALIE2026', 'NOTIFIED')
ON CONFLICT (id) DO NOTHING;

-- 17. Thêm Lô Hàng Nhập Kho Hàng Loạt (Inventory Batch Imports từ admin.html)
INSERT INTO inventory_imports (id, batch_code, supplier_name, total_quantity, total_cost, imported_by, notes) VALUES
(1, 'IMP-BATCH-2026-001', 'Nhà Cung Cấp Milano Leather S.p.A (Ý)', 50, 450000000.00, 'Admin Executive', 'Nhập lô hàng len Cashmere và da thuộc thủ công BST Thu Đông 2026'),
(2, 'IMP-BATCH-2026-002', 'Atelier Da Thuộc Florence (Ý)', 100, 680000000.00, 'Admin Executive', 'Nhập da bê thuộc Nappa hảo hạng khâu túi xách và giày boots'),
(3, 'IMP-BATCH-2026-003', 'Xưởng Lụa Tơ Tằm Bảo Lộc (Việt Nam)', 200, 320000000.00, 'Admin Executive', 'Lụa tơ tằm Mulberry 100% nguyên bản dệt đầm dạ hội')
ON CONFLICT (id) DO NOTHING;

-- 18. Thêm Lịch Sử Giao Dịch Thanh Toán (Payment Transactions - VNPAY, VISA, COD)
INSERT INTO payment_transactions (id, transaction_code, order_id, payment_method, amount, gateway_response_code, status) VALUES
(1, 'VNPAY-TRANS-99882211', 1, 'VNPAY_QR', 18900000.00, '00', 'SUCCESS'),
(2, 'VISA-TRANS-77112233', 2, 'VISA', 18900000.00, '00', 'SUCCESS'),
(3, 'VISA-TRANS-55449911', 3, 'VISA', 25000000.00, '00', 'SUCCESS')
ON CONFLICT (id) DO NOTHING;
