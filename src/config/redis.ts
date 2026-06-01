import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;
let warned = false;

export const getRedis = (): Redis | null => {
  if (redis) return redis;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (!warned) {
      logger.warn('Redis not configured — running without cache');
      warned = true;
    }
    return null;
  }
  try {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  } catch (err) {
    logger.error('Failed to initialize Redis client');
    return null;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  const r = getRedis();
  if (!r) return false;
  try {
    await r.ping();
    return true;
  } catch {
    return false;
  }
};
