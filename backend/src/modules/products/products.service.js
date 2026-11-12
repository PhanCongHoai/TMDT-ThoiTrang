const ProductRepository = require('./products.repository');

class ProductService {
  static async getProducts(filters) {
    return await ProductRepository.findAll(filters);
  }

  static async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  static async createProduct(data) {
    return await ProductRepository.create(data);
  }

  static async deleteProduct(id) {
    return await ProductRepository.softDelete(id);
  }

  static async getCategories() {
    return await ProductRepository.findAllCategories();
  }
}

module.exports = ProductService;

