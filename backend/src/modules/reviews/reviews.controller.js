const ReviewRepository = require('./reviews.repository');
const ApiResponse = require('../../utils/response');

class ReviewController {
  static async getProductReviews(req, res, next) {
    try {
      const { id } = req.params;
      const data = await ReviewRepository.findByProductId(id);
      return res.json({
        status: 'success',
        summary: data.summary,
        reviews: data.reviews
      });
    } catch (err) {
      next(err);
    }
  }

  static async createReview(req, res, next) {
    try {
      const { productId, userName, userEmail, rating, comment, variantInfo } = req.body;
      if (!userName || !comment) {
        return ApiResponse.error(res, 'Tên và nội dung đánh giá là bắt buộc', 400);
      }

      await ReviewRepository.create({ productId, userName, userEmail, rating, comment, variantInfo });
      return ApiResponse.success(res, null, 'Cảm ơn bạn! Đánh giá đã được lưu vào Cơ sở dữ liệu và xuất bản thành công!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminReviews(req, res, next) {
    try {
      const reviews = await ReviewRepository.findAllForAdmin();
      return ApiResponse.success(res, reviews, 'Lấy danh sách đánh giá thành công', 200, {
        total: reviews.length
      });
    } catch (err) {
      next(err);
    }
  }

  static async approveReview(req, res, next) {
    try {
      const { id } = req.params;
      await ReviewRepository.approve(id);
      return ApiResponse.success(res, null, `Đã phê duyệt công khai đánh giá #${id} thành công!`);
    } catch (err) {
      next(err);
    }
  }

  static async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      await ReviewRepository.delete(id);
      return ApiResponse.success(res, null, `Đã xóa đánh giá #${id} khỏi CSDL thành công!`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReviewController;

