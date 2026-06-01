import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';
import { fail } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Zod validation errors from fastify
  if ((error as any).validation) {
    return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid request'));
  }

  if (error instanceof AppError) {
    logger.warn({ code: error.code, message: error.message }, 'AppError');
    return reply.status(error.statusCode).send(fail(error.code, error.message));
  }

  // Don't expose stack traces in production
  const message = env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : error.message || 'Internal server error';

  logger.error({ err: error }, 'Unhandled error');
  return reply.status(500).send(fail('INTERNAL_ERROR', message));
};
