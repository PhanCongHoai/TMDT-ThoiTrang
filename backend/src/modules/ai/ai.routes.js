const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/response');

router.post('/chat', async (req, res, next) => {
  try {
    const { sessionCode, message } = req.body;
    const userMsg = (message || '').toLowerCase();

    let botReply = 'Cảm ơn Quý khách! Chuyên viên tư vấn phong cách AURALIÈ đã ghi nhận yêu cầu và sẽ hỗ trợ ngay.';
    let intent = 'GENERAL_QUERY';
    let recommendedProduct = null;

    if (userMsg.includes('tiệc') || userMsg.includes('phối đồ') || userMsg.includes('mặc gì')) {
      intent = 'RECOMMEND_OUTFIT';
      botReply = 'Gợi ý Stylist AURALIÈ: Sự kết hợp giữa Minimalist Silk Trench Dress và Túi Xách Heritage Tan sẽ nâng tầm thần thái quyến rũ.';
      recommendedProduct = { id: 5, name: "Minimalist Silk Trench Dress", price: 18900000, img: "assets/card_2.jpg" };
    } else if (userMsg.includes('hot') || userMsg.includes('bán chạy') || userMsg.includes('túi')) {
      intent = 'BESTSELLER_QUERY';
      botReply = 'Sản phẩm Best-Seller tháng này: Túi xách da bê Heritage Tan chế tác thủ công mạ vàng 18K.';
      recommendedProduct = { id: 13, name: "Heritage Tan Leather Handbag", price: 24000000, img: "assets/card_4.jpg" };
    } else if (userMsg.includes('size') || userMsg.includes('kích thước')) {
      intent = 'SIZE_GUIDE';
      botReply = 'Bảng Size Chuẩn Châu Âu AURALIÈ: Size S (42-50kg), Size M (51-59kg), Size L (60-68kg).';
    } else if (userMsg.includes('giảm giá') || userMsg.includes('mã') || userMsg.includes('vip')) {
      intent = 'COUPON_REQUEST';
      botReply = 'Mã ưu đãi VIP hôm nay: AURALIE2026 (Giảm 20% cho đơn từ 10tr).';
    }

    return ApiResponse.success(res, {
      sessionCode: sessionCode || 'SESS-AI-' + Date.now(),
      intent,
      reply: botReply,
      recommendedProduct,
      timestamp: new Date().toISOString()
    }, 'Phản hồi tư vấn AI thành công');
  } catch (err) {
    next(err);
  }
});

router.post('/search-image', (req, res) => {
  return ApiResponse.success(res, {
    aiExtraction: {
      detectedCategory: 'Áo Vest & Blazer',
      primaryColor: 'Đen Tuyền / Khaki Lux',
      stylePattern: 'Haute Couture European Tailored',
      confidenceScore: '98.6%'
    },
    recommendations: [
      { id: 1, name: "Double-Breasted Tailored Suit", category: "Áo Vest & Blazer", price: 12500000, similarity: "98.6%", img: "assets/card_1.jpg" },
      { id: 2, name: "Black Blazer & High Boots Set", category: "Áo Vest & Blazer", price: 16800000, similarity: "94.2%", img: "assets/card_5.jpg" }
    ]
  }, 'AI Computer Vision: Đã trích xuất đặc trưng hình ảnh và phân tích kiểu dáng thành công!');
});

module.exports = router;

