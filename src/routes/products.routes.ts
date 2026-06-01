import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { ProductsController } from '../controllers/products.controller';

export const productsRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.get('/products', ProductsController.search);
  app.get('/categories', ProductsController.getCategories);
};
