import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { OrderController } from '../controllers/orders.controller';

export const ordersRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.post('/orders/checkout', OrderController.checkout);
  app.get('/orders', OrderController.getOrders);
  app.get('/orders/:orderId', OrderController.getOrderDetails);
};
