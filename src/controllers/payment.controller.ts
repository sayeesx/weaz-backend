import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class PaymentController {
  /** Explicit verification triggered by frontend after Razorpay Checkout succeeds */
  static async verifyPayment(request: FastifyRequest, reply: FastifyReply) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body as any;
    
    const isValid = await PaymentService.verifyFrontendSignature(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    );

    if (!isValid) {
      return sendError(reply, 'PAYMENT_SIGNATURE_INVALID', 'Invalid payment signature');
    }

    const payment = await PaymentService.markPaymentPaid(
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      'frontend'
    );
    
    return sendSuccess(reply, { verified: true, payment });
  }
}
