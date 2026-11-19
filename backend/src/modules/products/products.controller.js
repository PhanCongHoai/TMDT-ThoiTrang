const ProductService = require('./products.service');
const ApiResponse = require('../../utils/response');

class ProductController {
  static async getFilters(req, res, next) {
    try {
      return ApiResponse.success(res, await ProductService.getFilters(), 'Đã tải bộ lọc');
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req, res, next) {
    try {
      const { category, search, tag, limit, size, color } = req.query;
      if ([size, color].some(value => value !== undefined && typeof value !== 'string')
          || size?.length > 20 || color?.length > 100) {
        return ApiResponse.error(res, 'Kích cỡ hoặc màu sắc không hợp lệ.', 400);
      }
      const products = await ProductService.getProducts({ category, search, tag, limit, size: size?.trim(), color: color?.trim() });
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
      const { name, categoryId, basePrice, description, tag, material, fit, imageData } = req.body;
      if (!name || !basePrice) {
        return ApiResponse.error(res, 'Tên và giá sản phẩm là bắt buộc', 400);
      }

      const result = await ProductService.createProduct({
        name, categoryId, basePrice, description, tag, material, fit, imageData
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

