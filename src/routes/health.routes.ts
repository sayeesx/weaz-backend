import { FastifyInstance } from 'fastify';
import { checkRedisHealth } from '../config/redis';
import { isRazorpayConfigured, isRazorpayTestMode } from '../config/razorpay';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';

export const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', async (request, reply) => {
    // Check Supabase
    let supabaseOk = false;
    try {
      const { error } = await supabaseAdmin.from('products').select('id').limit(1);
      supabaseOk = !error;
    } catch {
      supabaseOk = false;
    }

    // Check Redis
    const redisOk = await checkRedisHealth();

    return {
      status: 'ok',
      environment: env.APP_ENV,
      node_env: env.NODE_ENV,
      services: {
        supabase: supabaseOk ? 'ok' : 'error',
        redis: redisOk ? 'ok' : 'skipped',
        groq: env.GROQ_API_KEY ? 'configured' : 'missing',
        razorpay: isRazorpayConfigured() 
          ? (isRazorpayTestMode() ? 'configured_test_mode' : 'configured_live') 
          : 'missing'
      },
      timestamp: new Date().toISOString()
    };
  });
};
