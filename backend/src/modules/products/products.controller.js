const ProductService = require('./products.service');
const ApiResponse = require('../../utils/response');

class ProductController {
  static async getFilters(req, res, next) {
    try {
      const { category } = req.query;
      return ApiResponse.success(res, await ProductService.getFilters(category), 'Đã tải bộ lọc');
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req, res, next) {
    try {
      const { category, search, tag, limit, size, color, material, fit, minPrice, maxPrice, sort } = req.query;
      if ([size, color, material, fit].some(value => value !== undefined && typeof value !== 'string')
          || size?.length > 50 || color?.length > 100 || material?.length > 100 || fit?.length > 100) {
        return ApiResponse.error(res, 'Thông số bộ lọc không hợp lệ.', 400);
      }
      const products = await ProductService.getProducts({
        category,
        search,
        tag,
        limit,
        size: size?.trim(),
        color: color?.trim(),
        material: material?.trim(),
        fit: fit?.trim(),
        minPrice,
        maxPrice,
        sort
      });
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
      const {
        name, categoryId, basePrice, price, description,
        material, fit, lining, hardware, origin,
        variants, color, size, stockQuantity, imageData, imageUrl
      } = req.body;
      const resolvedPrice = basePrice !== undefined ? basePrice : price;
      if (!name || resolvedPrice === undefined) {
        return ApiResponse.error(res, 'Tên và giá sản phẩm là bắt buộc', 400);
      }

      const result = await ProductService.createProduct({
        name, categoryId, basePrice: resolvedPrice, description,
        material, fit, lining, hardware, origin,
        variants, color, size, stockQuantity, imageData, imageUrl
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

