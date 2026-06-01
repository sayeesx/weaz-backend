import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { registerSecurity } from './middleware/security';
import { errorHandler } from './middleware/error';
import { rateLimitConfig } from './middleware/rateLimit';
import { logger } from './utils/logger';

// Routes
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { businessRoutes } from './routes/business.routes';
import { productsRoutes } from './routes/products.routes';
import { chatRoutes } from './routes/chat.routes';
import { cartRoutes } from './routes/cart.routes';
import { ordersRoutes } from './routes/orders.routes';
import { supportRoutes } from './routes/support.routes';
import { paymentRoutes } from './routes/payment.routes';
import { registerRequestId } from './middleware/requestId';

export const buildApp = async () => {
  const app = Fastify({
    logger: false, // We use our own pino logger
  });

  // Unique Request IDs
  registerRequestId(app);

  // Security
  await registerSecurity(app);

  // CORS
  const corsOrigins: string[] = [];
  if (env.FRONTEND_URL) corsOrigins.push(env.FRONTEND_URL);
  if (env.CORS_ORIGINS) {
    corsOrigins.push(...env.CORS_ORIGINS.split(',').map(o => o.trim()));
  }
  if (env.NODE_ENV === 'development') {
    corsOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173');
  }

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: rateLimitConfig.global.max,
    timeWindow: rateLimitConfig.global.timeWindow,
    errorResponseBuilder: () => ({
      success: false,
      data: null,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please slow down.',
      },
    }),
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(businessRoutes);
  await app.register(productsRoutes);
  await app.register(chatRoutes);
  await app.register(cartRoutes);
  await app.register(ordersRoutes);
  await app.register(supportRoutes);
  await app.register(paymentRoutes);

  return app;
};
