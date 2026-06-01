import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '../services/chat.service';
import { sendSuccess } from '../utils/apiResponse';

export class ChatController {
  static async createSession(request: FastifyRequest, reply: FastifyReply) {
    const session = await ChatService.createSession(request.token!, request.user!.id);
    return sendSuccess(reply, session);
  }

  static async getSessions(request: FastifyRequest, reply: FastifyReply) {
    const sessions = await ChatService.getUserSessions(request.token!, request.user!.id);
    return sendSuccess(reply, sessions);
  }

  static async getMessages(request: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = request.params as any;
    const messages = await ChatService.getSessionMessages(request.token!, request.user!.id, sessionId);
    return sendSuccess(reply, messages);
  }

  static async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = request.params as any;
    const { message } = request.body as any;
    const result = await ChatService.sendMessage(request.token!, request.user!.id, sessionId, message);
    return sendSuccess(reply, result);
  }
}
