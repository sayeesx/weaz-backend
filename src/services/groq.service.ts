import { Groq } from 'groq-sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ProductDTO, ProductService } from './product.service';
import { WEAZ_BUSINESS, WeazSettings } from '../config/weaz';
import { KnowledgeBaseEntry } from './business.service';
import { extractCartItemsFromMessage } from './productSearch.service';

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export interface GroqContext {
  settings: WeazSettings;
  kb: KnowledgeBaseEntry[];
  products: ProductDTO[];
}

export class GroqService {
  static async parseMessage(
    userMessage: string,
    history: any[],
    context: GroqContext
  ) {
    // 1. Natural language cart extraction pre-processing
    // If the user said "5 milk", find it before we ask the LLM
    const items = extractCartItemsFromMessage(userMessage, context.products);
    const cartHint = items.length > 0 
      ? `\nSYSTEM HINT (Use this if intent is add_to_cart): User wants to add:\n${items.map(i => `- ${i.quantity} x ${i.product.name} (ProductID: ${i.product.id})`).join('\n')}` 
      : '';

    const systemPrompt = `You are Weaz AI Automation, an AI employee for a 10-minute commerce and delivery platform named Weaz.

BUSINESS RULES & STRICT SCOPE:
- You must ONLY answer questions related to Weaz commerce, delivery, products, orders, payments, refunds, support, and account help.
- If a user asks ANYTHING outside Weaz (like coding, politics, medical, movies, general knowledge), politely refuse and redirect to Weaz services.
- Never invent products, prices, or delivery areas. Use ONLY the data provided below.
- Weaz delivers in approx ${context.settings.estimatedDeliveryMinutes} minutes.
- Delivery fee is ₹${context.settings.deliveryFee} below ₹${context.settings.freeDeliveryAbove}, free above it.
- Service areas: ${context.settings.serviceAreas.join(', ')}

KNOWLEDGE BASE:
${context.kb.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n')}

CATALOG (ID, Name, Price, Stock, Category):
${context.products.map(p => `${p.id} | ${p.name} | ₹${p.price} | Stock: ${p.stock} | ${p.category || 'Unknown'}`).join('\n')}
${cartHint}

LANGUAGES:
- Support English, Malayalam, Hindi, mixed (Manglish, Hinglish).
- Reply naturally in the same language/script used by the user.

RESPONSE FORMAT:
You MUST reply with ONLY a strictly valid JSON object, matching this format exactly:
{
  "reply": "customer-facing reply here",
  "intent": "product_search | add_to_cart | checkout | payment | tracking | faq | complaint | refund | human_handoff | out_of_scope | general",
  "language": "en | ml | hi | mixed",
  "actions": [
    {
      "type": "add_to_cart",
      "payload": { "productId": "uuid", "quantity": 1 }
    },
    {
      "type": "search_products",
      "payload": { "query": "milk" }
    }
  ]
}

- For checkout, tell them you will provide a payment link or proceed (backend will inject link).
- Never invent products. If requested product is absent from Catalog, say it's out of stock or unavailable.
- For out of scope requests, use intent "out_of_scope" and action type "none".
- Return ONLY JSON. No markdown fences.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ];

    try {
      // 8 second timeout abort controller
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const completion = await groq.chat.completions.create({
        messages: messages as any,
        model: env.GROQ_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500, // Reduced for speed
      }, { signal: controller.signal });

      clearTimeout(timeout);

      let content = completion.choices[0]?.message?.content || '{}';
      
      // Cleanup accidental markdown fences around json
      content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

      return {
        json: JSON.parse(content),
        usage: completion.usage,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.error('Groq parsing timeout (8s)');
      } else {
        logger.error({ err: error }, 'Groq parsing error');
      }
      return {
        json: {
          reply: "I'm currently experiencing high demand. Please try again or type 'support' to talk to a human.",
          intent: "general",
          language: "en",
          actions: []
        },
        usage: null,
        error: error.message
      };
    }
  }
}
