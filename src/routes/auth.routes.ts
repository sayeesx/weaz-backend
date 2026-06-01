import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimitConfig } from '../middleware/rateLimit';

export const authRoutes = async (app: FastifyInstance) => {
  // Public routes
  app.post('/auth/send-otp', {
    config: { rateLimit: authRateLimitConfig },
    handler: AuthController.sendOtp,
  });

  app.post('/auth/verify-otp', {
    config: { rateLimit: authRateLimitConfig },
    handler: AuthController.verifyOtp,
  });
};
