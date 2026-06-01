import { FastifyRequest, FastifyReply } from 'fastify';
import { SupportService } from '../services/support.service';
import { sendSuccess } from '../utils/apiResponse';

export class SupportController {
  static async createTicket(request: FastifyRequest, reply: FastifyReply) {
    const { issue_type, description, priority, orderId, requires_human } = request.body as any;
    const ticket = await SupportService.createTicket(
      request.token!,
      request.user!.id,
      orderId,
      issue_type,
      description,
      priority || 'normal',
      requires_human || false
    );
    return sendSuccess(reply, ticket);
  }

  static async getTickets(request: FastifyRequest, reply: FastifyReply) {
    const tickets = await SupportService.getUserTickets(request.token!, request.user!.id);
    return sendSuccess(reply, tickets);
  }
}
