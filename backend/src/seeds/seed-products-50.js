const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../config/db');

async function seedNewProducts() {
  const newProducts = [
    // Category 1: Áo Vest & Blazer (21-26)
    {
      id: 21,
      name: 'Ivory Satin Peak-Lapel Blazer',
      slug: 'ivory-satin-peak-lapel-blazer',
      description: 'Áo Blazer lụa satin màu ngà với thiết kế ve nhọn Peak-Lapel hoàng gia, mang lại vẻ thanh lịch và quyền quý tuyệt đối.',
      base_price: 15500000,
      category_id: 1,
      tag: 'NEW ARRIVAL',
      material: 'Lụa Satin Cao Cấp & Cashmere',
      fit: 'Structured Slim Fit',
      lining: 'Lụa Cupro Mát Lạnh',
      hardware: 'Khuy Ngọc Trai Khắc Thủ Công',
      origin: 'Atelier AURALIÈ Đồng Khởi',
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'S', color: 'Trắng Ngà (Ivory White)', stock: 8, sku: 'AUR-IVBLAZ-S-IV' },
        { size: 'M', color: 'Trắng Ngà (Ivory White)', stock: 12, sku: 'AUR-IVBLAZ-M-IV' },
        { size: 'L', color: 'Trắng Ngà (Ivory White)', stock: 6, sku: 'AUR-IVBLAZ-L-IV' }
      ]
    },
    {
      id: 22,
      name: 'Midnight Navy Pinstripe Suit',
      slug: 'midnight-navy-pinstripe-suit',
      description: 'Bộ Suit kẻ sọc Pinstripe xanh navy cổ điển, may từ sợi lông cừu Merino Super 150s mềm mượt cho quý ông thành đạt.',
      base_price: 18200000,
      category_id: 1,
      tag: 'EXCLUSIVE',
      material: '100% Merino Super 150s Wool',
      fit: 'Savile Row Tailored Fit',
      lining: 'Lụa Habotai Chống Nhăn',
      hardware: 'Khuy Sừng Tự Nhiên',
      origin: 'Atelier AURALIÈ Đồng Khởi',
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'M', color: 'Xanh Navy (Midnight Navy)', stock: 10, sku: 'AUR-NVST-M-NV' },
        { size: 'L', color: 'Xanh Navy (Midnight Navy)', stock: 8, sku: 'AUR-NVST-L-NV' },
        { size: 'XL', color: 'Xanh Navy (Midnight Navy)', stock: 5, sku: 'AUR-NVST-XL-NV' }
      ]
    },
    {
      id: 23,
      name: 'Burgundy Velvet Evening Tuxedo',
      slug: 'burgundy-velvet-evening-tuxedo',
      description: 'Tuxedo nhung đỏ rượu vang Burgundy quý phái, phối ve sam cổ điển bọc lụa đen huyền thoại cho đêm dạ tiệc gala.',
      base_price: 21000000,
      category_id: 1,
      tag: 'LIMITED',
      material: 'Nhung Lụa Ý & Satin Silk',
      fit: 'Slim Evening Tuxedo Cut',
      lining: 'Lụa Satin Đỏ Rượu',
      hardware: 'Khuy Bọc Nhung Thủ Công',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'S', color: 'Đỏ Rượu (Burgundy)', stock: 6, sku: 'AUR-BGTUX-S-BG' },
        { size: 'M', color: 'Đỏ Rượu (Burgundy)', stock: 9, sku: 'AUR-BGTUX-M-BG' },
        { size: 'L', color: 'Đỏ Rượu (Burgundy)', stock: 7, sku: 'AUR-BGTUX-L-BG' }
      ]
    },
    {
      id: 24,
      name: 'Double-Breasted Houndstooth Blazer',
      slug: 'double-breasted-houndstooth-blazer',
      description: 'Áo Blazer họa tiết nanh sói Houndstooth đen trắng kinh điển, thiết kế 6 khuy đôi tôn dáng chuẩn phom Châu Âu.',
      base_price: 16500000,
      category_id: 1,
      tag: 'BESTSELLER',
      material: 'Len Cashmere & Wool Blend',
      fit: 'European Double-Breasted',
      lining: 'Lụa Cupro Thêu Họa Tiết',
      hardware: 'Khuy Kim Loại Mạ Vàng Cổ',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'S', color: 'Nanh Sói (Houndstooth)', stock: 7, sku: 'AUR-HDBLZ-S-HD' },
        { size: 'M', color: 'Nanh Sói (Houndstooth)', stock: 11, sku: 'AUR-HDBLZ-M-HD' },
        { size: 'L', color: 'Nanh Sói (Houndstooth)', stock: 5, sku: 'AUR-HDBLZ-L-HD' }
      ]
    },
    {
      id: 25,
      name: 'Charcoal Grey Virgin Wool Suit',
      slug: 'charcoal-grey-virgin-wool-suit',
      description: 'Bộ Suit màu xám than lịch lãm dệt từ 100% Virgin Wool nhập khẩu vùng Biella nước Ý, chống nhăn và thoáng khí tối ưu.',
      base_price: 17800000,
      category_id: 1,
      tag: 'NEW ARRIVAL',
      material: '100% Italian Virgin Wool',
      fit: 'Modern Regular Tailored',
      lining: 'Lụa Bemberg Thoáng Khí',
      hardware: 'Khuy Gỗ Mun Đánh Bóng Tay',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'M', color: 'Xám Than (Charcoal Grey)', stock: 10, sku: 'AUR-CGST-M-CG' },
        { size: 'L', color: 'Xám Than (Charcoal Grey)', stock: 8, sku: 'AUR-CGST-L-CG' },
        { size: 'XL', color: 'Xám Than (Charcoal Grey)', stock: 6, sku: 'AUR-CGST-XL-CG' }
      ]
    },
    {
      id: 26,
      name: 'Emerald Silk Jacquard Tuxedo',
      slug: 'emerald-silk-jacquard-tuxedo',
      description: 'Áo Tuxedo gấm lụa Jacquard màu ngọc lục bảo dệt nổi hoa văn hoàng gia, khẳng định đẳng cấp xa xỉ tại các sự kiện thượng lưu.',
      base_price: 23500000,
      category_id: 1,
      tag: 'EXCLUSIVE',
      material: 'Lụa Tơ Tằm Jacquard Ý',
      fit: 'Tailored Black Tie Cut',
      lining: 'Lụa Tơ Tằm Tự Nhiên',
      hardware: 'Khuy Bọc Gấm Mạ Vàng 18K',
      origin: 'Atelier AURALIÈ Haute Couture',
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'S', color: 'Xanh Lục Bảo (Emerald Green)', stock: 5, sku: 'AUR-EMJAC-S-EM' },
        { size: 'M', color: 'Xanh Lục Bảo (Emerald Green)', stock: 7, sku: 'AUR-EMJAC-M-EM' },
        { size: 'L', color: 'Xanh Lục Bảo (Emerald Green)', stock: 4, sku: 'AUR-EMJAC-L-EM' }
      ]
    },

    // Category 2: Váy & Đầm Dạ Hội (27-32)
    {
      id: 27,
      name: 'Royal Scarlet Silk Mermaid Gown',
      slug: 'royal-scarlet-silk-mermaid-gown',
      description: 'Đầm dạ hội đuôi cá màu đỏ Scarlet lộng lẫy bằng lụa Satin Duchesse, tà váy xòe tự nhiên tôn trọn đường cong quyến rũ.',
      base_price: 26800000,
      category_id: 2,
      tag: 'LIMITED',
      material: '100% Satin Duchesse Silk',
      fit: 'Mermaid Silhouette',
      lining: 'Lụa Tơ Tằm Habotai',
      hardware: 'Khóa Kéo Ẩn YKK Mạ Vàng',
      origin: 'Atelier AURALIÈ Haute Couture',
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'S', color: 'Đỏ Scarlet (Royal Scarlet)', stock: 6, sku: 'AUR-SCGOW-S-SC' },
        { size: 'M', color: 'Đỏ Scarlet (Royal Scarlet)', stock: 8, sku: 'AUR-SCGOW-M-SC' },
        { size: 'L', color: 'Đỏ Scarlet (Royal Scarlet)', stock: 5, sku: 'AUR-SCGOW-L-SC' }
      ]
    },
    {
      id: 28,
      name: 'Champagne Crystal Plissé Dress',
      slug: 'champagne-crystal-plisse-dress',
      description: 'Đầm dạ tiệc màu Champagne dập ly Plissé đính kết pha lê Swarovski thủ công quanh cổ áo và eo, tỏa sáng kiêu sa.',
      base_price: 22500000,
      category_id: 2,
      tag: 'BESTSELLER',
      material: 'Lụa Chiffon Dập Ly & Pha Lê Swarovski',
      fit: 'Flowing Empire Waist',
      lining: 'Lụa Dệt Tay Thoáng Mát',
      hardware: 'Khóa Cài Pha Lê Swarovski',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_4.jpg',
      variants: [
        { size: 'S', color: 'Champagne (Vàng Sâm Panh)', stock: 8, sku: 'AUR-CHPLI-S-CP' },
        { size: 'M', color: 'Champagne (Vàng Sâm Panh)', stock: 10, sku: 'AUR-CHPLI-M-CP' },
        { size: 'L', color: 'Champagne (Vàng Sâm Panh)', stock: 6, sku: 'AUR-CHPLI-L-CP' }
      ]
    },
    {
      id: 29,
      name: 'Noir One-Shoulder Crepe Gown',
      slug: 'noir-one-shoulder-crepe-gown',
      description: 'Đầm dạ hội lệch vai màu đen tuyền Noir may từ lụa Crepe cao cấp của Pháp, điểm nhấn xẻ tà cao kiêu kỳ và bí ẩn.',
      base_price: 19800000,
      category_id: 2,
      tag: 'NEW ARRIVAL',
      material: 'Lụa Silk Crepe de Chine Pháp',
      fit: 'One-Shoulder High Slit Cut',
      lining: 'Lụa Lót Siêu Mịn',
      hardware: 'Khuy Bấm Kim Loại Mạ Vàng',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'S', color: 'Đen Tuyền (Noir Black)', stock: 7, sku: 'AUR-NRGOW-S-BK' },
        { size: 'M', color: 'Đen Tuyền (Noir Black)', stock: 9, sku: 'AUR-NRGOW-M-BK' },
        { size: 'L', color: 'Đen Tuyền (Noir Black)', stock: 5, sku: 'AUR-NRGOW-L-BK' }
      ]
    },
    {
      id: 30,
      name: 'Sapphire Blue Off-Shoulder Gown',
      slug: 'sapphire-blue-off-shoulder-gown',
      description: 'Đầm dạ tiệc trễ vai xanh ngọc Sapphire lộng lẫy, chất liệu lụa Mikado dày dặn đứng phom tạo vẻ uy quyền quý phái.',
      base_price: 24000000,
      category_id: 2,
      tag: 'EXCLUSIVE',
      material: 'Lụa Mikado Tơ Tằm Thượng Hạng',
      fit: 'Off-Shoulder Ballgown Silhouette',
      lining: 'Lớp Lót Lụa Đôi',
      hardware: 'Khóa Giọt Nước Vàng 18K',
      origin: 'Atelier AURALIÈ Haute Couture',
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'S', color: 'Xanh Sapphire (Sapphire Blue)', stock: 6, sku: 'AUR-SPGOW-S-SP' },
        { size: 'M', color: 'Xanh Sapphire (Sapphire Blue)', stock: 8, sku: 'AUR-SPGOW-M-SP' },
        { size: 'L', color: 'Xanh Sapphire (Sapphire Blue)', stock: 4, sku: 'AUR-SPGOW-L-SP' }
      ]
    },
    {
      id: 31,
      name: 'Pearl White Backless Silk Dress',
      slug: 'pearl-white-backless-silk-dress',
      description: 'Đầm lụa trắng ngọc trai hở lưng chữ V quyến rũ, thiết kế tối giản thanh lịch vượt thời gian cho những buổi tiệc tối sang trọng.',
      base_price: 21200000,
      category_id: 2,
      tag: 'BESTSELLER',
      material: '100% Mulberry Silk (Lụa Dâu Tằm)',
      fit: 'Bias Cut Flowing Fit',
      lining: 'Lụa Tơ Tằm Bảo Lộc',
      hardware: 'Dây Xích Vàng Đeo Lưng 18K',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'S', color: 'Trắng Ngọc Trai (Pearl White)', stock: 9, sku: 'AUR-PWDRS-S-PW' },
        { size: 'M', color: 'Trắng Ngọc Trai (Pearl White)', stock: 11, sku: 'AUR-PWDRS-M-PW' },
        { size: 'L', color: 'Trắng Ngọc Trai (Pearl White)', stock: 6, sku: 'AUR-PWDRS-L-PW' }
      ]
    },
    {
      id: 32,
      name: 'Rose Gold Metallic Pleated Gown',
      slug: 'rose-gold-metallic-pleated-gown',
      description: 'Đầm dạ hội ánh kim vàng hồng Rose Gold dập ly toàn thân lấp lánh dưới ánh đèn vũ hội, tôn vinh thần thái nữ vương.',
      base_price: 27500000,
      category_id: 2,
      tag: 'LIMITED',
      material: 'Lụa Metallic Pleated Cao Cấp',
      fit: 'A-Line Floor-Length Fit',
      lining: 'Lụa Satin Mềm Mại',
      hardware: 'Thắt Lưng Kim Loại Mạ Vàng Hồng',
      origin: 'Atelier AURALIÈ Haute Couture',
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'S', color: 'Vàng Hồng (Rose Gold)', stock: 5, sku: 'AUR-RGGOW-S-RG' },
        { size: 'M', color: 'Vàng Hồng (Rose Gold)', stock: 7, sku: 'AUR-RGGOW-M-RG' },
        { size: 'L', color: 'Vàng Hồng (Rose Gold)', stock: 4, sku: 'AUR-RGGOW-L-RG' }
      ]
    },

    // Category 3: Áo Khoác Thu Đông (33-38)
    {
      id: 33,
      name: 'Camel Belted Wool Wrap Coat',
      slug: 'camel-belted-wool-wrap-coat',
      description: 'Áo khoác dạ thắt đai màu nâu Camel kinh điển, dệt từ len lông cừu nguyên chất giữ ấm hoàn hảo với phom dáng mềm mại quý phái.',
      base_price: 23500000,
      category_id: 3,
      tag: 'BESTSELLER',
      material: '100% Pure Virgin Wool',
      fit: 'Wrap Coat with Tie Belt',
      lining: 'Lụa Cupro Cao Cấp',
      hardware: 'Khuy Ẩn & Đai Len Cùng Màu',
      origin: 'Atelier AURALIÈ Winter Craft',
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'S', color: 'Nâu Lạc Đà (Camel)', stock: 7, sku: 'AUR-CMCOAT-S-CM' },
        { size: 'M', color: 'Nâu Lạc Đà (Camel)', stock: 12, sku: 'AUR-CMCOAT-M-CM' },
        { size: 'L', color: 'Nâu Lạc Đà (Camel)', stock: 8, sku: 'AUR-CMCOAT-L-CM' }
      ]
    },
    {
      id: 34,
      name: 'Oatmeal Cashmere Turtleneck Poncho',
      slug: 'oatmeal-cashmere-turtleneck-poncho',
      description: 'Áo choàng Poncho cổ lọ màu yến mạch Oatmeal đan từ 100% Cashmere Mông Cổ siêu nhẹ, tạo nét phóng khoáng đầy thượng lưu.',
      base_price: 16800000,
      category_id: 3,
      tag: 'NEW ARRIVAL',
      material: '100% Mongolian Cashmere',
      fit: 'Relaxed Flowing Poncho Fit',
      lining: 'Không Lớp Lót (Dệt Liền Khối)',
      hardware: 'Viền Da Bò Khâu Tay',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'FreeSize', color: 'Màu Yến Mạch (Oatmeal)', stock: 15, sku: 'AUR-OTPON-FS-OT' }
      ]
    },
    {
      id: 35,
      name: 'Black Shearling Leather Biker Jacket',
      slug: 'black-shearling-leather-biker-jacket',
      description: 'Áo khoác da cừu lót lông Shearling cao cấp màu đen bóng, thiết kế Biker cá tính giữ ấm tuyệt đối trong mùa băng giá.',
      base_price: 29000000,
      category_id: 3,
      tag: 'EXCLUSIVE',
      material: 'Da Cừu Nappa & Lông Cừu Tự Nhiên',
      fit: 'Structured Biker Fit',
      lining: 'Lông Cừu Shearling 100%',
      hardware: 'Khóa Kéo Kim Loại Răng Đồng Mạ Bạc',
      origin: 'Atelier AURALIÈ Leathercraft',
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'S', color: 'Đen Tuyền (Jet Black)', stock: 5, sku: 'AUR-SHJKT-S-BK' },
        { size: 'M', color: 'Đen Tuyền (Jet Black)', stock: 8, sku: 'AUR-SHJKT-M-BK' },
        { size: 'L', color: 'Đen Tuyền (Jet Black)', stock: 6, sku: 'AUR-SHJKT-L-BK' }
      ]
    },
    {
      id: 36,
      name: 'Houndstooth Wool Trench Coat',
      slug: 'houndstooth-wool-trench-coat',
      description: 'Áo măng tô dạ họa tiết nanh sói Houndstooth dáng dài hai hàng khuy, ve áo bản to sang trọng chuẩn phong cách quý tộc Anh Quốc.',
      base_price: 25500000,
      category_id: 3,
      tag: 'NEW ARRIVAL',
      material: 'Len Lông Cừu Dày Dặn Scotland',
      fit: 'Long Double-Breasted Trench',
      lining: 'Lụa Satin Chống Thấm Nhẹ',
      hardware: 'Khuy Sừng Đen Khắc Chìm Logo',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'M', color: 'Nanh Sói (Houndstooth)', stock: 9, sku: 'AUR-HDTRN-M-HD' },
        { size: 'L', color: 'Nanh Sói (Houndstooth)', stock: 7, sku: 'AUR-HDTRN-L-HD' }
      ]
    },
    {
      id: 37,
      name: 'Monochrome Quilted Down Parka',
      slug: 'monochrome-quilted-down-parka',
      description: 'Áo phao lông vũ ngỗng trắng dáng dài phong cách Monochrome siêu nhẹ, chống gió và chống nước tối ưu cho các chuyến du lịch tuyết.',
      base_price: 19500000,
      category_id: 3,
      tag: 'BESTSELLER',
      material: 'Vải Kỹ Thuật Chống Thấm & 90% Lông Vũ Ngỗng',
      fit: 'Slim Longline Puffer Fit',
      lining: 'Lớp Chống Tĩnh Điện Cao Cấp',
      hardware: 'Khóa Kéo Chống Nước YKK Aquaguard',
      origin: 'Atelier AURALIÈ Performance',
      image: 'assets/card_4.jpg',
      variants: [
        { size: 'S', color: 'Trắng Sữa (Milky White)', stock: 8, sku: 'AUR-PRK-S-WH' },
        { size: 'M', color: 'Trắng Sữa (Milky White)', stock: 11, sku: 'AUR-PRK-M-WH' },
        { size: 'L', color: 'Trắng Sữa (Milky White)', stock: 7, sku: 'AUR-PRK-L-WH' }
      ]
    },
    {
      id: 38,
      name: 'Ivory Double-Breasted Peacoat',
      slug: 'ivory-double-breasted-peacoat',
      description: 'Áo khoác Peacoat dạ ngắn màu ngà Ivory hai hàng khuy mạ vàng, mang lại vẻ trẻ trung, năng động nhưng không kém phần đẳng cấp.',
      base_price: 17500000,
      category_id: 3,
      tag: 'LIMITED',
      material: 'Len Lông Cừu Merinos & Silk',
      fit: 'Tailored Short Peacoat',
      lining: 'Lụa Cupro Thêu Logo',
      hardware: 'Khuy Kim Loại Mạ Vàng 18K',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'S', color: 'Trắng Ngà (Ivory White)', stock: 6, sku: 'AUR-IVPEA-S-IV' },
        { size: 'M', color: 'Trắng Ngà (Ivory White)', stock: 9, sku: 'AUR-IVPEA-M-IV' },
        { size: 'L', color: 'Trắng Ngà (Ivory White)', stock: 5, sku: 'AUR-IVPEA-L-IV' }
      ]
    },

    // Category 4: Túi Xách Da Cao Cấp (39-44)
    {
      id: 39,
      name: 'Burgundy Croc-Effect Kelly Bag',
      slug: 'burgundy-croc-effect-kelly-bag',
      description: 'Túi xách phom dáng Kelly màu đỏ rượu vang dập vân cá sấu bóng mờ, quai xách tay cứng cáp cùng khóa xoay kim loại mạ vàng 18K.',
      base_price: 28500000,
      category_id: 4,
      tag: 'LIMITED',
      material: 'Da Bò Ý Dập Vân Cá Sấu Nappa',
      fit: 'Structured Kelly Silhouette',
      lining: 'Da Dê Mềm Mại',
      hardware: 'Khóa Mạ Vàng 18K Chống Trầy',
      origin: 'Chế Tác Thủ Công Tiêu Chuẩn Ý',
      image: 'assets/card_4.jpg',
      variants: [
        { size: 'FreeSize', color: 'Đỏ Rượu (Burgundy)', stock: 8, sku: 'AUR-BGKL-FS-BG' }
      ]
    },
    {
      id: 40,
      name: 'Noir Quilted Lambskin Flap Bag',
      slug: 'noir-quilted-lambskin-flap-bag',
      description: 'Túi đeo chéo nắp gập chần bông quả trám da cừu non Lambskin siêu mềm, dây xích luồn da kim loại vàng sang trọng vượt thời gian.',
      base_price: 26000000,
      category_id: 4,
      tag: 'BESTSELLER',
      material: '100% Da Cừu Non Lambskin',
      fit: 'Medium Flap Crossbody',
      lining: 'Da Đỏ Burgundy Sang Trọng',
      hardware: 'Khóa Logo AURALIÈ Xoay Vàng',
      origin: 'Atelier AURALIÈ Leathercraft',
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'FreeSize', color: 'Đen Tuyền (Noir Black)', stock: 12, sku: 'AUR-NRFLP-FS-BK' }
      ]
    },
    {
      id: 41,
      name: 'Taupe Grained Calfskin Tote',
      slug: 'taupe-grained-calfskin-tote',
      description: 'Túi Tote da bê hạt màu xám Taupe thanh lịch, ngăn chứa rộng đựng vừa laptop 14 inch, hoàn hảo cho quý cô công sở bận rộn.',
      base_price: 23000000,
      category_id: 4,
      tag: 'NEW ARRIVAL',
      material: 'Da Bê Hạt Grained Calfskin',
      fit: 'Everyday Spacious Tote',
      lining: 'Vải Microfiber Da Lộn Êm Ái',
      hardware: 'Đinh Tán Đáy Túi Bảo Vệ Da',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_2.jpg',
      variants: [
        { size: 'FreeSize', color: 'Xám Taupe (Taupe Grey)', stock: 10, sku: 'AUR-TPTOT-FS-TP' }
      ]
    },
    {
      id: 42,
      name: 'Emerald Velvet Evening Minaudière',
      slug: 'emerald-velvet-evening-minaudiere',
      description: 'Ví dạ tiệc Minaudière hình hộp bọc nhung ngọc lục bảo viền kim loại mạ vàng đính đá, phụ kiện thảm đỏ hoàn mỹ cho quý bà.',
      base_price: 19500000,
      category_id: 4,
      tag: 'EXCLUSIVE',
      material: 'Nhung Lụa Pháp & Khung Đồng Thau',
      fit: 'Rigid Box Evening Clutch',
      lining: 'Da Nappa Mạ Ánh Kim',
      hardware: 'Khóa Bấm Đính Đá Quý Tự Nhiên',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_6.jpg',
      variants: [
        { size: 'FreeSize', color: 'Xanh Lục Bảo (Emerald Green)', stock: 7, sku: 'AUR-EMMIN-FS-EM' }
      ]
    },
    {
      id: 43,
      name: 'Caramel Saddle Leather Shoulder Bag',
      slug: 'caramel-saddle-leather-shoulder-bag',
      description: 'Túi đeo vai phom yên ngựa Saddle màu nâu Caramel cổ điển, đường chỉ viền khâu tay thủ công bằng sáp ong bền bỉ trọn đời.',
      base_price: 21500000,
      category_id: 4,
      tag: 'NEW ARRIVAL',
      material: 'Da Bò Thuộc Thảo Mộc Box Calf',
      fit: 'Curved Saddle Shoulder Bag',
      lining: 'Lót Da Cừu Tự Nhiên',
      hardware: 'Khóa Móng Ngựa Mạ Vàng Cổ',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'FreeSize', color: 'Nâu Caramel (Caramel Brown)', stock: 9, sku: 'AUR-CMSDL-FS-CM' }
      ]
    },
    {
      id: 44,
      name: 'Ivory Lizard-Embossed Baguette',
      slug: 'ivory-lizard-embossed-baguette',
      description: 'Túi kẹp nách Baguette da dập vân kỳ đà màu trắng ngà Ivory tinh tế, phong cách Y2K thời thượng kết hợp nét cổ điển Haute Couture.',
      base_price: 20000000,
      category_id: 4,
      tag: 'BESTSELLER',
      material: 'Da Bò Ý Dập Vân Thằn Lằn (Lizard)',
      fit: 'Slim Shoulder Baguette',
      lining: 'Da Lộn Mềm Mại',
      hardware: 'Khóa Bấm Nam Châm Ẩn Mạ Vàng',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_5.jpg',
      variants: [
        { size: 'FreeSize', color: 'Trắng Ngà (Ivory White)', stock: 11, sku: 'AUR-IVBAG-FS-IV' }
      ]
    },

    // Category 5: Giày & Phụ Kiện (45-50)
    {
      id: 45,
      name: 'Crystal Embellished Satin Pumps',
      slug: 'crystal-embellished-satin-pumps',
      description: 'Giày cao gót 8cm lụa satin đính cài bông hoa pha lê lấp lánh ở mũi giày, kiệt tác giày cưới và dạ tiệc hoàng gia.',
      base_price: 16500000,
      category_id: 5,
      tag: 'LIMITED',
      material: 'Lụa Satin Láng Mịn & Pha Lê',
      fit: '8cm Pointed-Toe Ergonomic Fit',
      lining: 'Da Dê Lót Đệm Chống Đau Chân',
      hardware: 'Cài Hoa Pha Lê Swarovski Mạ Bạc',
      origin: 'Atelier AURALIÈ Shoes',
      image: 'assets/card_5.jpg',
      variants: [
        { size: '36', color: 'Trắng Sữa (Milky White)', stock: 5, sku: 'AUR-PMP-36-WH' },
        { size: '37', color: 'Trắng Sữa (Milky White)', stock: 8, sku: 'AUR-PMP-37-WH' },
        { size: '38', color: 'Trắng Sữa (Milky White)', stock: 6, sku: 'AUR-PMP-38-WH' }
      ]
    },
    {
      id: 46,
      name: 'Cognac Chelsea Boots Calfskin',
      slug: 'cognac-chelsea-boots-calfskin',
      description: 'Giày bốt Chelsea da bê màu nâu Cognac may thủ công, thun co giãn hai bên tiện lợi cùng đế cao su đúc nguyên khối chống trượt.',
      base_price: 14800000,
      category_id: 5,
      tag: 'BESTSELLER',
      material: 'Da Bê Ý Nguyên Tấm Aniline',
      fit: 'Ankle Chelsea Classic Fit',
      lining: 'Da Thuộc Thoáng Khí Khử Mùi',
      hardware: 'Chun Co Giãn Cao Cấp Chống Dão',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_6.jpg',
      variants: [
        { size: '39', color: 'Nâu Cognac (Cognac Brown)', stock: 6, sku: 'AUR-CHL-39-CG' },
        { size: '40', color: 'Nâu Cognac (Cognac Brown)', stock: 9, sku: 'AUR-CHL-40-CG' },
        { size: '41', color: 'Nâu Cognac (Cognac Brown)', stock: 7, sku: 'AUR-CHL-41-CG' }
      ]
    },
    {
      id: 47,
      name: '24K Gold Monogram Silk Scarf',
      slug: '24k-gold-monogram-silk-scarf',
      description: 'Khăn choàng lụa tơ tằm dệt tay 90x90cm in họa tiết Monogram dát ánh kim vàng 24K, viền khăn cuộn mép thủ công tinh tế.',
      base_price: 6800000,
      category_id: 5,
      tag: 'NEW ARRIVAL',
      material: '100% Lụa Tơ Tằm Tự Nhiên Twill',
      fit: 'Kích Thước Vuông 90cm x 90cm',
      lining: 'Viền Cuộn Tay Hand-Rolled',
      hardware: 'Hộp Quà Gỗ Sơn Mài Thượng Hạng',
      origin: 'Atelier AURALIÈ Accessories',
      image: 'assets/card_1.jpg',
      variants: [
        { size: 'FreeSize', color: 'Vàng Hoàng Gia (Royal Gold)', stock: 15, sku: 'AUR-SCF-FS-GD' }
      ]
    },
    {
      id: 48,
      name: 'Black Suede Knee-High Boots',
      slug: 'black-suede-knee-high-boots',
      description: 'Giày bốt da lộn cổ cao dưới đầu gối màu đen tuyền, gót trụ 7cm vững chãi tôn đôi chân thon dài quyến rũ trong mùa lễ hội.',
      base_price: 18500000,
      category_id: 5,
      tag: 'EXCLUSIVE',
      material: 'Da Lộn Suede Ý Cao Cấp',
      fit: 'Knee-High Slim Leg Fit',
      lining: 'Da Bò Mềm Lót Toàn Thân Bốt',
      hardware: 'Khóa Kéo Dọc Bắp Chân Mạ Vàng',
      origin: 'Atelier AURALIÈ',
      image: 'assets/card_2.jpg',
      variants: [
        { size: '36', color: 'Đen Tuyền (Jet Black)', stock: 5, sku: 'AUR-KNH-36-BK' },
        { size: '37', color: 'Đen Tuyền (Jet Black)', stock: 8, sku: 'AUR-KNH-37-BK' },
        { size: '38', color: 'Đen Tuyền (Jet Black)', stock: 6, sku: 'AUR-KNH-38-BK' }
      ]
    },
    {
      id: 49,
      name: 'Bespoke 18K Gold Cufflinks Pair',
      slug: 'bespoke-18k-gold-cufflinks-pair',
      description: 'Cặp khuy măng sét mạ vàng 18K khảm xà cừ tự nhiên chạm khắc logo AURALIÈ độc bản, mảnh ghép hoàn hảo cho áo sơ mi may đo.',
      base_price: 7200000,
      category_id: 5,
      tag: 'NEW ARRIVAL',
      material: 'Đồng Thau Mạ Vàng 18K & Xà Cừ Biển',
      fit: 'Universal Cufflink Fit',
      lining: 'Hộp Nhung Đỏ Nhập Khẩu Pháp',
      hardware: 'Chốt Xoay Khóa Chắc Chắn',
      origin: 'Atelier AURALIÈ Jewelry',
      image: 'assets/card_3.jpg',
      variants: [
        { size: 'FreeSize', color: 'Vàng 18K Khảm Xà Cừ', stock: 20, sku: 'AUR-CFL-FS-18K' }
      ]
    },
    {
      id: 50,
      name: 'Burgundy Patent Strappy Sandals',
      slug: 'burgundy-patent-strappy-sandals',
      description: 'Sandal cao gót 9cm quai mảnh da bóng màu đỏ mận Burgundy, tôn vinh đôi bàn chân ngọc ngà trong các đêm tiệc mùa hè và thu đông.',
      base_price: 13900000,
      category_id: 5,
      tag: 'BESTSELLER',
      material: 'Da Bò Thuộc Bóng Patent',
      fit: '9cm Ankle-Strap Evening Sandal',
      lining: 'Lót Da Dê Êm Ái',
      hardware: 'Khóa Cài Mạ Vàng 18K',
      origin: 'Atelier AURALIÈ Shoes',
      image: 'assets/card_4.jpg',
      variants: [
        { size: '36', color: 'Đỏ Mận (Burgundy)', stock: 6, sku: 'AUR-SD-36-BG' },
        { size: '37', color: 'Đỏ Mận (Burgundy)', stock: 9, sku: 'AUR-SD-37-BG' },
        { size: '38', color: 'Đỏ Mận (Burgundy)', stock: 7, sku: 'AUR-SD-38-BG' }
      ]
    }
  ];

  console.log('Inserting 30 new products (IDs 21 - 50)...');
  for (const p of newProducts) {
    const existing = await query('SELECT id FROM products WHERE id = @id OR slug = @slug', { id: p.id, slug: p.slug });
    if (existing.recordset.length === 0) {
      await query(`
        SET IDENTITY_INSERT products ON;
        INSERT INTO products (id, name, slug, description, base_price, category_id, tag, material, fit, lining, hardware, origin, is_active)
        VALUES (@id, @name, @slug, @description, @base_price, @category_id, @tag, @material, @fit, @lining, @hardware, @origin, 1);
        SET IDENTITY_INSERT products OFF;
      `, {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        base_price: p.base_price,
        category_id: p.category_id,
        tag: p.tag,
        material: p.material,
        fit: p.fit,
        lining: p.lining,
        hardware: p.hardware,
        origin: p.origin
      });
      console.log(`[+] Added Product ${p.id}: ${p.name}`);
    } else {
      console.log(`[=] Product ${p.id} exists`);
    }

    // Insert Image
    const imgExisting = await query('SELECT id FROM product_images WHERE product_id = @productId AND is_thumbnail = 1', { productId: p.id });
    if (imgExisting.recordset.length === 0) {
      await query(`
        INSERT INTO product_images (product_id, image_url, is_thumbnail)
        VALUES (@productId, @imageUrl, 1)
      `, {
        productId: p.id,
        imageUrl: p.image
      });
    }

    // Insert Variants
    for (const v of p.variants) {
      const vExisting = await query('SELECT id FROM product_variants WHERE product_id = @productId AND size = @size AND color = @color', {
        productId: p.id,
        size: v.size,
        color: v.color
      });
      if (vExisting.recordset.length === 0) {
        await query(`
          INSERT INTO product_variants (product_id, size, color, stock_quantity, variant_price, sku)
          VALUES (@productId, @size, @color, @stock, @price, @sku)
        `, {
          productId: p.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          price: p.base_price,
          sku: v.sku
        });
      }
    }
  }

  const checkCounts = await query(`
    SELECT c.id as category_id, c.name as category_name, c.slug, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.id
  `);
  console.log('\n=== Thống kê sản phẩm theo từng danh mục ===');
  console.table(checkCounts.recordset);

  const total = await query('SELECT COUNT(*) as total_active_products FROM products WHERE is_active = 1');
  console.log('Tổng số sản phẩm đang hoạt động:', total.recordset[0].total_active_products);
  process.exit(0);
}

seedNewProducts().catch(err => {
  console.error('Lỗi khi seed sản phẩm:', err);
  process.exit(1);
});
