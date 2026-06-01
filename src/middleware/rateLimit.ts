import { FastifyInstance } from 'fastify';

export const rateLimitConfig = {
  global: {
    max: 100,
    timeWindow: '15 minutes',
  },
};

export const chatRateLimitConfig = {
  max: 30,
  timeWindow: '10 minutes',
};

export const authRateLimitConfig = {
  max: 20,
  timeWindow: '15 minutes',
};
