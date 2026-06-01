import { createSupabaseUserClient, supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { GroqService, GroqContext } from './groq.service';
import { ProductService, ProductDTO } from './product.service';
import { BusinessService } from './business.service';
import { IntentRouter } from './intentRouter.service';
import { CartService } from './cart.service';
import { OrderService } from './order.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { WEAZ_BUSINESS_ID } from '../config/weaz';

export class ChatService {
  static async createSession(token: string, userId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        title: 'Weaz chat',
        channel: 'web_simulator',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create chat session', 'DB_ERROR');
    return session;
  }

  static async getUserSessions(token: string, userId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch sessions', 'DB_ERROR');

    const enriched = await Promise.all(
      (sessions || []).map(async (sess) => {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('content, role, created_at')
          .eq('session_id', sess.id)
          .order('created_at', { ascending: false })
          .limit(1);
        return { ...sess, last_message: msgs?.[0] || null };
      })
    );

    return enriched;
  }

  static async getSessionMessages(token: string, userId: string, sessionId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) throw new NotFoundError('Session not found or access denied');

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new AppError('Failed to fetch messages', 'DB_ERROR');
    return messages || [];
  }

  static async sendMessage(token: string, userId: string, sessionId: string, userMessage: string) {
    const supabase = createSupabaseUserClient(token);
    const startTime = Date.now();

    // 1. Auth verify session
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) throw new NotFoundError('Session not found or access denied');

    // 2. Insert User msg
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        role: 'user',
        content: userMessage,
      })
      .select()
      .single();

    // 3. Fast-Path Deterministic intent routing (bypasses Groq)
    let fastPath = await IntentRouter.tryFastPath(userMessage);

    let aiResponse: any = null;
    let groqUsage: any = null;
    let groqError: string | null = null;
    let intent = 'general';
    let language = 'en';

    if (fastPath.handled) {
      logger.debug('Routing via Fast Path');
      aiResponse = {
        reply: fastPath.reply,
        intent: fastPath.intent || 'general',
        language: fastPath.language || 'en',
        actions: fastPath.actions || [],
      };
      intent = aiResponse.intent;
      language = aiResponse.language;
    } else {
      // 4. Need Groq — Fetch context
      logger.debug('Routing via Groq LLM');
      const [fullContext, history] = await Promise.all([
        BusinessService.getBusinessContext(),
        supabase.from('chat_messages').select('role, content').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(10),
      ]);

      const products = await ProductService.getAllProducts();
      
      const groqContext: GroqContext = {
        settings: fullContext.settings,
        kb: fullContext.kb,
        products,
      };

      const orderedHistory = (history.data || []).reverse();
      const groqResult = await GroqService.parseMessage(userMessage, orderedHistory, groqContext);

      aiResponse = groqResult.json;
      groqUsage = groqResult.usage;
      groqError = groqResult.error || null;
      intent = aiResponse.intent || 'general';
      language = aiResponse.language || 'en';
    }

    const latencyMs = Date.now() - startTime;

    // 5. Execute Backend Actions (Add to cart, etc)
    let cartSummary: any = null;
    let productsList: ProductDTO[] = fastPath.products || [];
    let actionsExecuted: any[] = [];

    if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
      for (const action of aiResponse.actions) {
        try {
          if (action.type === 'add_to_cart' && action.payload?.productId) {
            const qty = action.payload.quantity || 1;
            const updatedCart = await CartService.addItem(token, userId, action.payload.productId, qty);
            cartSummary = {
              subtotal: updatedCart.subtotal,
              delivery_fee: updatedCart.delivery_fee,
              total: updatedCart.total,
              items_count: updatedCart.items?.length || 0,
            };
            actionsExecuted.push({ type: 'add_to_cart', success: true });
          } else if (action.type === 'search_products' && action.payload?.query) {
             if (productsList.length === 0) {
                productsList = (await ProductService.searchProducts(action.payload.query)).slice(0, 5);
             }
             actionsExecuted.push({ type: 'search_products', success: true });
          } else if (action.type === 'checkout') {
             const orderResult = await OrderService.checkout(token, userId);
             actionsExecuted.push({ type: 'checkout', success: true, payload: orderResult });
          }
        } catch (err: any) {
          logger.error({ err }, `Action ${action.type} failed`);
          actionsExecuted.push({ type: action.type, success: false, error: err.message });
        }
      }
    }

    // 6. Save Assistant msg
    const { data: assistantMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        role: 'assistant',
        content: aiResponse.reply || 'Sorry, I could not process that request safely.',
        intent: intent,
        language: language,
        metadata: {
          actions: actionsExecuted,
          cart: cartSummary,
          products: productsList,
          fast_path: fastPath.handled,
        },
      })
      .select()
      .single();

    // 7. Update session last_message_at
    await supabase.from('chat_sessions').update({ last_message_at: new Date().toISOString() }).eq('id', sessionId);

    // 8. Log AI interaction (non-critical)
    try {
      await supabaseAdmin.from('ai_interactions').insert({
        session_id: sessionId,
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        model: fastPath.handled ? 'fast_path_heuristic' : env.GROQ_MODEL,
        prompt_tokens: groqUsage?.prompt_tokens || 0,
        completion_tokens: groqUsage?.completion_tokens || 0,
        total_tokens: groqUsage?.total_tokens || 0,
        latency_ms: latencyMs,
        intent: intent,
        language: language,
        success: groqError === null,
        error: groqError,
      });
    } catch (e) {
      logger.warn('Failed to log AI interaction');
    }

    return {
      user_message: userMsg,
      assistant_message: assistantMsg,
      intent,
      language,
      actions: actionsExecuted,
      cart: cartSummary,
      products: productsList,
      fast_path: fastPath.handled,
      latencyMs,
    };
  }
}
