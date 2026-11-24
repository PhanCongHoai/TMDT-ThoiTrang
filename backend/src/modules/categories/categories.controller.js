const CategoryService = require('./categories.service');
const ApiResponse = require('../../utils/response');

class CategoryController {
  static async getAll(req, res, next) {
    try {
      const categories = await CategoryService.getAll();
      return ApiResponse.success(res, categories, 'Lấy danh sách danh mục thành công', 200, {
        total: categories.length
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return ApiResponse.error(res, 'ID danh mục không hợp lệ.', 400);
      }
      const category = await CategoryService.getById(id);
      if (!category) {
        return ApiResponse.error(res, 'Không tìm thấy danh mục.', 404);
      }
      return ApiResponse.success(res, category, 'Lấy thông tin danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, slug, description } = req.body;
      const category = await CategoryService.create({ name, slug, description });
      return ApiResponse.success(res, category, `Đã thêm danh mục mới "${category.name}" thành công!`, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return ApiResponse.error(res, 'ID danh mục không hợp lệ.', 400);
      }
      const { name, slug, description } = req.body;
      const category = await CategoryService.update(id, { name, slug, description });
      return ApiResponse.success(res, category, `Đã cập nhật danh mục "${category.name}" thành công!`);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return ApiResponse.error(res, 'ID danh mục không hợp lệ.', 400);
      }
      const result = await CategoryService.delete(id);
      return ApiResponse.success(res, result, `Đã xóa danh mục "${result.name}" thành công!`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoryController;
