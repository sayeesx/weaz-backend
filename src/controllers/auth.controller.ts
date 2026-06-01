import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  static async sendOtp(request: FastifyRequest, reply: FastifyReply) {
    const { phone } = request.body as any;
    const result = await AuthService.sendOtp(phone);
    return sendSuccess(reply, result);
  }

  static async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const { phone, otp } = request.body as any;
    const session = await AuthService.verifyOtpAndCreateSession(phone, otp);
    return sendSuccess(reply, session);
  }
}
