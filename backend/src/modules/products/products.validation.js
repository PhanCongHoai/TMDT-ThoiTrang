const ApiResponse = require('../../utils/response');

/**
 * Validation Middleware cho Module Products
 * Kiểm tra dữ liệu đầu vào cho việc thêm sản phẩm, truy vấn ID và query parameters
 */
class ProductValidation {
  static validateGetById(req, res, next) {
    const { id } = req.params;
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
      return ApiResponse.error(res, 'Mã sản phẩm không hợp lệ (phải là số nguyên dương).', 400);
    }
    next();
  }

  static validateCreateProduct(req, res, next) {
    const { name, categoryId, basePrice, description, tag, material, fit } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return ApiResponse.error(res, 'Tên sản phẩm là bắt buộc.', 400);
    }
    if (name.trim().length > 200) {
      return ApiResponse.error(res, 'Tên sản phẩm không được vượt quá 200 ký tự.', 400);
    }

    if (basePrice === undefined || basePrice === null || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      return ApiResponse.error(res, 'Giá sản phẩm phải là một số không âm hợp lệ.', 400);
    }

    if (categoryId !== undefined && categoryId !== null) {
      const numCat = Number(categoryId);
      if (isNaN(numCat) || numCat <= 0) {
        return ApiResponse.error(res, 'Danh mục sản phẩm không hợp lệ.', 400);
      }
    }

    if (tag && typeof tag === 'string' && tag.length > 50) {
      return ApiResponse.error(res, 'Tag sản phẩm không được vượt quá 50 ký tự.', 400);
    }

    if (material && typeof material === 'string' && material.length > 100) {
      return ApiResponse.error(res, 'Chất liệu không được vượt quá 100 ký tự.', 400);
    }

    if (fit && typeof fit === 'string' && fit.length > 100) {
      return ApiResponse.error(res, 'Form dáng không được vượt quá 100 ký tự.', 400);
    }

    next();
  }

  static validateDeleteProduct(req, res, next) {
    const { id } = req.params;
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
      return ApiResponse.error(res, 'Mã sản phẩm cần xóa không hợp lệ.', 400);
    }
    next();
  }
}

module.exports = ProductValidation;

