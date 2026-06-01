import { FastifyRequest, FastifyReply } from 'fastify';
import { CartService } from '../services/cart.service';
import { sendSuccess } from '../utils/apiResponse';

export class CartController {
  static async getCart(request: FastifyRequest, reply: FastifyReply) {
    const cart = await CartService.getActiveCart(request.token!, request.user!.id);
    return sendSuccess(reply, cart);
  }

  static async addItem(request: FastifyRequest, reply: FastifyReply) {
    const { productId, quantity } = request.body as any;
    const cart = await CartService.addItem(request.token!, request.user!.id, productId, quantity);
    return sendSuccess(reply, cart);
  }

  static async removeItem(request: FastifyRequest, reply: FastifyReply) {
    const { itemId } = request.params as any;
    await CartService.removeItem(request.token!, request.user!.id, itemId);
    return sendSuccess(reply, { success: true });
  }
}
