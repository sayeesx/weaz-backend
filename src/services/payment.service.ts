import { getRazorpay, isRazorpayTestMode } from '../config/razorpay';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { rupeesToPaise } from '../utils/money';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class PaymentService {
  /** Create Razorpay order and save to payments DB */
  static async createPayment(userId: string, orderId: string, amountRupees: number) {
    const rzp = getRazorpay();
    const isTest = isRazorpayTestMode();

    if (!rzp) {
      throw new AppError('Razorpay is not configured', 'PAYMENT_CONFIG_ERROR');
    }

    try {
      const amountPaise = rupeesToPaise(amountRupees);
      
      const rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `receipt_${orderId.replace(/-/g, '').slice(0, 30)}`, // Razorpay receipt max len 40
        notes: {
          order_id: orderId,
          user_id: userId,
          env: env.APP_ENV,
          is_test: isTest ? 'true' : 'false',
        },
      });

      // We rely on Razorpay standard checkout flow, not payment links API, because it's simpler
      // The frontend will render Razorpay Checkout with this provider_order_id

      let paymentObj: any = {
          order_id: orderId,
          user_id: userId,
          provider: 'razorpay',
          provider_order_id: rzpOrder.id,
          status: 'created',
          amount: amountRupees,
          raw_payload: rzpOrder,
      };

      try {
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .insert(paymentObj)
          .select()
          .single();
        if (payment) paymentObj = payment;
      } catch(e) {}

      return paymentObj;
    } catch (err: any) {
      logger.error({ err }, 'Razorpay order creation failed');
      throw new AppError(`Payment provider error: ${err.message}`, 'PAYMENT_ERROR');
    }
  }

  /** Verify webhook signature from Razorpay */
  private static verifySignature(payload: string, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }

  /** Verify direct checkout signature (from frontend) */
  static async verifyFrontendSignature(
    razorpayOrderId: string, 
    razorpayPaymentId: string, 
    razorpaySignature: string
  ): Promise<boolean> {
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');
    
    return generated === razorpaySignature;
  }

  /** Mark payment completed and update order */
  static async markPaymentPaid(providerOrderId: string, providerPaymentId: string, signature: string, source: 'frontend' | 'webhook') {
    let payment: any;
    try {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('provider_order_id', providerOrderId)
        .single();
      payment = data;
    } catch(e) {}

    if (payment && payment.status === 'paid') return payment; // Idempotent

    // Update payment record
    try {
      if (payment) {
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'paid',
            provider_payment_id: providerPaymentId,
            provider_signature: signature,
          })
          .eq('id', payment.id);
      }
    } catch(e) {}

    // Also update order status
    try {
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'payment_completed', // Enum order_status compatible?
        })
        .eq('id', payment?.order_id || 'unknown');
    } catch (e) {}

    return payment || { status: 'paid' };
  }
}
