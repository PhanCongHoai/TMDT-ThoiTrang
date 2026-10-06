const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'AURALIÈ Haute Couture Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// GET All Products (Covering all categories)
app.get('/api/v1/products', (req, res) => {
  const { category } = req.query;
  const allProducts = [
    {
      id: 1,
      name: "Double-Breasted Tailored Suit",
      catSlug: "vest-blazer",
      category: "Áo Vest & Blazer",
      price: 12500000,
      rating: 4.9,
      reviewCount: 128,
      img: "assets/card_1.jpg"
    },
    {
      id: 2,
      name: "Minimalist Silk Trench Dress",
      catSlug: "vay-dam",
      category: "Váy & Đầm Dạ Hội",
      price: 18900000,
      rating: 5.0,
      reviewCount: 94,
      img: "assets/card_2.jpg"
    },
    {
      id: 3,
      name: "Oversized Cashmere Wool Sweater",
      catSlug: "ao-khoac",
      category: "Áo Khoác Thu Đông",
      price: 8200000,
      rating: 4.8,
      reviewCount: 65,
      img: "assets/card_3.jpg"
    },
    {
      id: 4,
      name: "Heritage Tan Leather Handbag",
      catSlug: "tui-xach",
      category: "Túi Xách Da Cao Cấp",
      price: 24000000,
      rating: 4.9,
      reviewCount: 42,
      img: "assets/card_4.jpg"
    },
    {
      id: 5,
      name: "Black Blazer & High Boots Set",
      catSlug: "vest-blazer",
      category: "Áo Vest & Blazer",
      price: 16800000,
      rating: 4.9,
      reviewCount: 87,
      img: "assets/card_5.jpg"
    },
    {
      id: 6,
      name: "Midnight Navy Tailored Jacket",
      catSlug: "ao-khoac",
      category: "Áo Khoác Thu Đông",
      price: 14200000,
      rating: 4.7,
      reviewCount: 53,
      img: "assets/card_6.jpg"
    },
    {
      id: 7,
      name: "Auralia Emerald Velvet Gown",
      catSlug: "vay-dam",
      category: "Váy & Đầm Dạ Hội",
      price: 21500000,
      rating: 5.0,
      reviewCount: 31,
      img: "assets/card_2.jpg"
    },
    {
      id: 8,
      name: "Royale Gold Buckle Leather Boots",
      catSlug: "giay-phu-kien",
      category: "Giày & Phụ Kiện",
      price: 15800000,
      rating: 4.9,
      reviewCount: 29,
      img: "assets/card_5.jpg"
    }
  ];

  let filtered = allProducts;
  if (category && category !== 'all') {
    filtered = allProducts.filter(p => p.catSlug === category);
  }

  res.json({
    status: 'success',
    total: filtered.length,
    data: filtered
  });
});


// GET Product Reviews
app.get('/api/v1/products/:id/reviews', (req, res) => {
  res.json({
    status: 'success',
    summary: {
      averageRating: 4.9,
      totalReviews: 128,
      recommendationPercentage: 98,
      bars: { 5: 88, 4: 10, 3: 2, 2: 0, 1: 0 }
    },
    reviews: [
      {
        id: 101,
        userName: "Nguyễn Thành Trung",
        isVerified: true,
        rating: 5,
        variantInfo: "Màu: Đen Tuyền | Kích cỡ: M",
        date: "02/10/2026",
        comment: "Áo vest may phom rất chuẩn, mặc lên đứng dáng và cực kỳ tôn vai. Vải len Cashmere mềm mịn, mặc thoáng mát.",
        helpfulCount: 18
      },
      {
        id: 102,
        userName: "Lê Phương Anh",
        isVerified: true,
        rating: 5,
        variantInfo: "Màu: Đen Tuyền | Kích cỡ: S",
        date: "28/09/2026",
        comment: "Mua làm quà tặng sinh nhật cho sếp. Sếp rất khen chất liệu và đường kim mũi chỉ tỉ mỉ.",
        helpfulCount: 12
      }
    ]
  });
});

// POST Create New Review
app.post('/api/v1/reviews', (req, res) => {
  const { productId, userName, userEmail, rating, comment } = req.body;
  if (!userName || !comment) {
    return res.status(400).json({ status: 'error', message: 'Tên và nội dung đánh giá là bắt buộc' });
  }

  res.status(201).json({
    status: 'success',
    message: 'Đánh giá đã được ghi nhận thành công!',
    data: {
      id: Date.now(),
      productId: productId || 1,
      userName,
      rating: rating || 5,
      comment,
      createdAt: new Date().toISOString()
    }
  });
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`[AURALIÈ Backend] Server running on http://localhost:${PORT}`);
});

