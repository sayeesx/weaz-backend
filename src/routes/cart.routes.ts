import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { CartController } from '../controllers/cart.controller';

export const cartRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.get('/cart', CartController.getCart);
  app.post('/cart/items', CartController.addItem);
  app.delete('/cart/items/:itemId', CartController.removeItem);
};
