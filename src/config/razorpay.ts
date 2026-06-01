import Razorpay from 'razorpay';
import { env } from './env';
import { logger } from '../utils/logger';

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay | null => {
  if (razorpayInstance) return razorpayInstance;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay not configured');
    return null;
  }
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return razorpayInstance;
};

export const isRazorpayConfigured = (): boolean => {
  return !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
};

export const isRazorpayTestMode = (): boolean => {
  return env.RAZORPAY_TEST_MODE === 'true';
};
