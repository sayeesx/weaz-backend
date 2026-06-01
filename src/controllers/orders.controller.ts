import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/apiResponse';

export class OrderController {
  static async checkout(request: FastifyRequest, reply: FastifyReply) {
    const { deliveryAddress, customerNote } = request.body as any || {};
    const result = await OrderService.checkout(request.token!, request.user!.id, deliveryAddress, customerNote);
    return sendSuccess(reply, result);
  }

  static async getOrders(request: FastifyRequest, reply: FastifyReply) {
    const orders = await OrderService.getUserOrders(request.token!, request.user!.id);
    return sendSuccess(reply, orders);
  }

  static async getOrderDetails(request: FastifyRequest, reply: FastifyReply) {
    const { orderId } = request.params as any;
    const detail = await OrderService.getOrderDetail(request.token!, request.user!.id, orderId);
    return sendSuccess(reply, detail);
  }
}
