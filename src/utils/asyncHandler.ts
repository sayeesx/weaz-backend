import { FastifyRequest, FastifyReply } from 'fastify';

export const asyncHandler = (fn: (req: FastifyRequest, reply: FastifyReply) => Promise<any>) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await fn(req, reply);
    } catch (error) {
      if (!reply.sent) {
        throw error;
      }
    }
  };
};
