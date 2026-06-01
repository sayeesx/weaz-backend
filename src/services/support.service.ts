import { createSupabaseUserClient } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { WEAZ_BUSINESS_ID } from '../config/weaz';
import { BusinessService } from './business.service';

export class SupportService {
  static async createTicket(
    token: string,
    userId: string,
    orderId: string | undefined,
    issue_type: string,
    description: string,
    priority: string,
    requires_human: boolean
  ) {
    const supabase = createSupabaseUserClient(token);

    // Verify order belongs to user if orderId given
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (!order) throw new NotFoundError('Order not found or access denied');
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        order_id: orderId || null,
        issue_type,
        description,
        status: 'open',
        priority,
        requires_human,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create support ticket', 'DB_ERROR');
    return ticket;
  }

  static async getUserTickets(token: string, userId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch tickets', 'DB_ERROR');
    return tickets || [];
  }
}
