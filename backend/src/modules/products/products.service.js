const ProductRepository = require('./products.repository');
const ProductImage = require('./product-image');

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
    const parsed = ProductImage.parseImage(data.imageData);
    const image = parsed ? await ProductImage.save(parsed) : null;
    try {
      return await ProductRepository.create({ ...data, imageUrl: image?.url });
    } catch (error) {
      await ProductImage.remove(image);
      throw error;
    }
  }

  static async deleteProduct(id) {
    return await ProductRepository.softDelete(id);
  }

  static async getCategories() {
    return await ProductRepository.findAllCategories();
  }
}

module.exports = ProductService;

