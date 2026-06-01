import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { SupportController } from '../controllers/support.controller';

export const supportRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.post('/support/tickets', SupportController.createTicket);
  app.get('/support/tickets', SupportController.getTickets);
};
