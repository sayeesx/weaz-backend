import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

export const registerSecurity = async (app: FastifyInstance) => {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
};
