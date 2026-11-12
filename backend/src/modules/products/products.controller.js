const ProductService = require('./products.service');
const ApiResponse = require('../../utils/response');

class ProductController {
  static async getProducts(req, res, next) {
    try {
      const { category, search, tag, limit } = req.query;
      const products = await ProductService.getProducts({ category, search, tag, limit });
      return ApiResponse.success(res, products, 'Lấy danh sách sản phẩm thành công', 200, {
        total: products.length
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      return ApiResponse.success(res, product, 'Lấy chi tiết sản phẩm thành công');
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { name, categoryId, basePrice, description, tag, material, fit } = req.body;
      if (!name || !basePrice) {
        return ApiResponse.error(res, 'Tên và giá sản phẩm là bắt buộc', 400);
      }

      const result = await ProductService.createProduct({
        name, categoryId, basePrice, description, tag, material, fit
      });

      return ApiResponse.success(res, result, `Đã thêm sản phẩm "${name}" thành công vào Cơ Sở Dữ Liệu!`, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      return ApiResponse.success(res, null, `Đã xóa/ẩn sản phẩm #${id} khỏi hệ thống thành công!`);
    } catch (err) {
      next(err);
    }
  }

  static async getCategories(req, res, next) {
    try {
      const categories = await ProductService.getCategories();
      return ApiResponse.success(res, categories, 'Lấy danh mục thành công', 200, {
        total: categories.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProductController;

