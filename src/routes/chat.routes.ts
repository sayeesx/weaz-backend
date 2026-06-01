import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { ChatController } from '../controllers/chat.controller';
import { chatRateLimitConfig } from '../middleware/rateLimit';

export const chatRoutes = async (app: FastifyInstance) => {
  app.addHook('onRequest', authenticate);

  app.post('/chat/sessions', ChatController.createSession);
  app.get('/chat/sessions', ChatController.getSessions);
  app.get('/chat/sessions/:sessionId/messages', ChatController.getMessages);

  app.post('/chat/sessions/:sessionId/messages', {
    config: { rateLimit: chatRateLimitConfig },
    handler: ChatController.sendMessage,
  });
};
