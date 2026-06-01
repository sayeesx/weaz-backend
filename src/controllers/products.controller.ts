import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service';
import { sendSuccess } from '../utils/apiResponse';

export class ProductsController {
  static async search(request: FastifyRequest, reply: FastifyReply) {
    const { q, category } = request.query as any;
    
    if (q || category) {
      const all = await ProductService.getAllProducts();
      const results = await ProductService.searchProducts(q, category);
      return sendSuccess(reply, results);
    }
    
    const all = await ProductService.getAllProducts();
    return sendSuccess(reply, all);
  }
  
  static async getCategories(request: FastifyRequest, reply: FastifyReply) {
    const cats = await ProductService.getCategories();
    return sendSuccess(reply, cats);
  }
}
