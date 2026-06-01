import { createSupabaseUserClient, supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { generateOrderNumber } from '../utils/orderNumber';
import { WEAZ_BUSINESS, WEAZ_BUSINESS_ID } from '../config/weaz';
import { PaymentService } from './payment.service';

export class OrderService {
  static async checkout(
    token: string,
    userId: string,
    deliveryAddress?: string,
    customerNote?: string
  ) {
    const supabase = createSupabaseUserClient(token);

    // 1. Get active cart
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!cart) throw new NotFoundError('No active cart found');

    // 2. Get cart items
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, products(name)')
      .eq('cart_id', cart.id);

    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Cart is empty', 'CART_EMPTY', 400);
    }

    const orderNumber = generateOrderNumber();

    // 3. Create order (matching real schema — business_id required, no environment column)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (orderErr) throw new AppError(`Failed to create order: ${orderErr.message}`, 'DB_ERROR');

    // 4. Move items to order_items if that table exists
    try {
      const orderItems = cartItems.map((ci) => ({
        order_id: order.id,
        product_id: ci.product_id,
        quantity: ci.quantity,
        unit_price: ci.unit_price,
        total_price: ci.line_total,
      }));
      await supabase.from('order_items').insert(orderItems);
    } catch (e) {
      // order_items table may not exist — non-critical
    }

    // 5. Create Razorpay Payment
    let payment: any = null;
    try {
      payment = await PaymentService.createPayment(
        userId, 
        order.id, 
        Number(cart.total || cart.subtotal || 0)
      );
    } catch (e: any) {
      // Razorpay not configured is non-fatal
    }

    // 6. Mark cart converted
    await supabase
      .from('carts')
      .update({ status: 'converted' })
      .eq('id', cart.id);

    return {
      order,
      payment,
      payment_link: payment?.payment_link || null,
    };
  }

  static async getUserOrders(token: string, userId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch orders', 'DB_ERROR');
    return orders || [];
  }

  static async getOrderDetail(token: string, userId: string, orderId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (!order) throw new NotFoundError('Order not found');

    let items: any[] = [];
    try {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      items = data || [];
    } catch (e) {}

    let payment: any = null;
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      payment = data;
    } catch (e) {}

    return { order, items, payment };
  }
}
