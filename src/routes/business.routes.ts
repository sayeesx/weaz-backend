import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { BusinessController } from '../controllers/business.controller';

export const businessRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.get('/businesses/weaz', BusinessController.getBusinessDetails);
};
