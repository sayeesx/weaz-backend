import { FastifyRequest, FastifyReply } from 'fastify';
import { BusinessService } from '../services/business.service';
import { sendSuccess } from '../utils/apiResponse';

export class BusinessController {
  static async getBusinessDetails(request: FastifyRequest, reply: FastifyReply) {
    const data = await BusinessService.getBusinessContext();
    return sendSuccess(reply, data);
  }
}
