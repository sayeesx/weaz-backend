import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import crypto from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

export const registerRequestId = (app: FastifyInstance) => {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.requestId =
      (request.headers['x-request-id'] as string) ||
      crypto.randomUUID();
  });
};
