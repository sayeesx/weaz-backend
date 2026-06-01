import { ProductDTO, ProductService } from './product.service';
import { BusinessService } from './business.service';
import { searchProducts } from './productSearch.service';
import { detectLanguage, DetectedLanguage } from './language.service';
import { WEAZ_BUSINESS } from '../config/weaz';

export interface FastPathResult {
  handled: boolean;
  reply?: string;
  intent?: string;
  language?: DetectedLanguage;
  products?: ProductDTO[];
  actions?: any[];
}

// ── Pattern lists ──────────────────────────────────────────────

const GREETING_PATTERNS = [
  /^(hi|hello|hey|hola|namaste|namaskar|namaskaram|vanakkam|hai|helo|hoi)\b/i,
  /^(good\s*(morning|afternoon|evening|night))/i,
  /^(suprabhatham?|sugamaano|sughamo|enthokke|enthanu vishesham)/i,
];

const SHOW_PRODUCTS_PATTERNS = [
  /\b(show|list|all|see|browse|display|what do you (have|sell)|entha (products?|saadhanangal)|products? (dikhao|batao|show)|kya (milega|hai|bechte))\b/i,
  /\b(products?|items?|catalogue|catalog)\s*$/i,
];

const CATEGORY_PATTERNS = [
  /\b(show|list|what)\b.*\b(categories|category|vibhagam|vibhagangal)\b/i,
  /\b(categories|category)\b/i,
];

const PRICE_PATTERNS = [
  /\b(price|rate|cost|ethra|kitna|kya price|how much|vila)\b/i,
];

const AVAILABILITY_PATTERNS = [
  /\b(available|undo|hai kya|milega|stock|in stock|kittum|kittumo)\b/i,
];

const DELIVERY_FEE_PATTERNS = [
  /\b(delivery\s*(fee|charge|cost)|shipping\s*(fee|charge|cost)|delivery ethra|kitna delivery|delivery rate)\b/i,
];

const SERVICE_AREA_PATTERNS = [
  /\b(service\s*area|deliver\s*(where|kaha|evide)|areas?\s*you\s*(serve|deliver|cover)|which\s*areas?|evide deliver)\b/i,
];

const DELIVERY_TIME_PATTERNS = [
  /\b(delivery\s*time|how\s*(long|fast)|ethra\s*samayam|kitna\s*time|when\s*will|time\s*for\s*delivery)\b/i,
];

const CART_SUMMARY_PATTERNS = [
  /\b(my\s*cart|show\s*cart|cart\s*summary|ente\s*cart|mera\s*cart|what.s\s*in\s*my\s*cart|cart\s*items)\b/i,
];

const HUMAN_HANDOFF_PATTERNS = [
  /\b(human\s*(agent|support)?|real\s*person|talk\s*to\s*(someone|agent|human)|connect\s*(agent|human|support)|agent\s*venam|support\s*venam|manushyan\s*venam)\b/i,
  /\b(managerinte|manager|supervisor|aarenkilum|help\s*me)\b/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(code|coding|program|python|javascript|html|css|react|algorithm)\b/i,
  /\b(politic|election|party|government|modi|trump|biden)\b/i,
  /\b(religion|god|bible|quran|hindu|muslim|christian)\b/i,
  /\b(movie|piracy|torrent|download\s*movie)\b/i,
  /\b(medical\s*advice|doctor|diagnos|symptom|disease|medicine|prescription)\b/i,
  /\b(legal\s*advice|lawyer|court|lawsuit|case\s*file)\b/i,
  /\b(homework|assignment|exam|study|school|college|university)\b/i,
  /\b(crypto|bitcoin|stock\s*market|forex|trading)\b/i,
];

// ── Out-of-scope refusal messages ──────────────────────────────

const OUT_OF_SCOPE_REPLIES: Record<string, string> = {
  en: "I can help only with Weaz orders, products, delivery, payments, refunds, and support. What do you need from Weaz?",
  ml: "Njan Weaz order, products, delivery, payment, refund, support related questions mathram sahayikkam. Weaz-il entha venam?",
  hi: "मैं सिर्फ Weaz orders, products, delivery, payments, refunds और support से जुड़ी मदद कर सकता हूँ. Weaz में आपको क्या चाहिए?",
  mixed: "I can help only with Weaz orders, products, delivery, payments, refunds, and support. Entha venam Weaz-il?",
};

// ── Intent Router ──────────────────────────────────────────────

export class IntentRouter {
  /**
   * Try to handle the message deterministically without Groq.
   * Returns { handled: true, reply, intent, ... } if fast-path matches.
   * Returns { handled: false } if Groq is needed.
   */
  static async tryFastPath(message: string): Promise<FastPathResult> {
    const lang = detectLanguage(message);
    const lower = message.toLowerCase().trim();

    // 1. Out-of-scope check (highest priority)
    if (OUT_OF_SCOPE_PATTERNS.some(p => p.test(lower))) {
      return {
        handled: true,
        reply: OUT_OF_SCOPE_REPLIES[lang] || OUT_OF_SCOPE_REPLIES.en,
        intent: 'out_of_scope',
        language: lang,
        actions: [{ type: 'none', payload: {} }],
      };
    }

    // 2. Greeting
    if (GREETING_PATTERNS.some(p => p.test(lower)) && lower.length < 30) {
      const greetings: Record<string, string> = {
        en: "Hello! 👋 Welcome to Weaz — your 10-minute delivery partner. I can help with products, orders, payments, delivery, and support. What do you need?",
        ml: "Hello! 👋 Weaz-nte 10-minute delivery-ilekku swagatham. Products, orders, payments, delivery, support — enthum sahayikkam. Entha venam?",
        hi: "Hello! 👋 Weaz में आपका स्वागत है — 10 मिनट में डिलीवरी. Products, orders, payments, delivery, support — किसी भी चीज़ में मदद कर सकता हूँ. आपको क्या चाहिए?",
        mixed: "Hello! 👋 Welcome to Weaz — 10-minute delivery! Products, orders, payments, delivery, support — enthum help cheyyam. Entha venam?",
      };
      return {
        handled: true,
        reply: greetings[lang] || greetings.en,
        intent: 'general',
        language: lang,
      };
    }

    // 3. Show categories
    if (CATEGORY_PATTERNS.some(p => p.test(lower))) {
      const categories = await ProductService.getCategories();
      const catNames = categories.join(', ');
      return {
        handled: true,
        reply: `We have these categories: ${catNames}. Which category interests you?`,
        intent: 'product_search',
        language: lang,
      };
    }

    // 4. Show products
    if (SHOW_PRODUCTS_PATTERNS.some(p => p.test(lower))) {
      const products = await ProductService.getAllProducts();
      const available = products.filter(p => p.isAvailable);
      if (available.length === 0) {
        return {
          handled: true,
          reply: "Sorry, no products are available right now. Please check back later!",
          intent: 'product_search',
          language: lang,
          products: [],
        };
      }
      const list = available.slice(0, 10).map(p =>
        `• ${p.name} — ₹${p.price}${p.unit ? ` / ${p.unit}` : ''}`
      ).join('\n');
      return {
        handled: true,
        reply: `Here are our products:\n${list}\n\nWould you like to add anything to your cart?`,
        intent: 'product_search',
        language: lang,
        products: available.slice(0, 10),
      };
    }

    // 5. Price query
    if (PRICE_PATTERNS.some(p => p.test(lower))) {
      const products = await ProductService.getAllProducts();
      const matched = searchProducts(lower.replace(PRICE_PATTERNS.find(p => p.test(lower))!, '').trim(), products);
      if (matched.length > 0) {
        const lines = matched.slice(0, 5).map(p =>
          `${p.name}: ₹${p.price}${p.unit ? ` / ${p.unit}` : ''}${p.isAvailable ? '' : ' (out of stock)'}`
        );
        return {
          handled: true,
          reply: lines.join('\n'),
          intent: 'product_search',
          language: lang,
          products: matched.slice(0, 5),
        };
      }
      // Fall through to Groq if no match
    }

    // 6. Availability query
    if (AVAILABILITY_PATTERNS.some(p => p.test(lower))) {
      const products = await ProductService.getAllProducts();
      const query = lower.replace(AVAILABILITY_PATTERNS.find(p => p.test(lower))!, '').trim();
      if (query.length > 1) {
        const matched = searchProducts(query, products);
        if (matched.length > 0) {
          const lines = matched.slice(0, 5).map(p =>
            `${p.name}: ${p.isAvailable ? `✅ Available — ₹${p.price}${p.unit ? ` / ${p.unit}` : ''}` : '❌ Currently out of stock'}`
          );
          return {
            handled: true,
            reply: lines.join('\n'),
            intent: 'product_search',
            language: lang,
            products: matched.slice(0, 5),
          };
        }
      }
    }

    // 7. Delivery fee FAQ
    if (DELIVERY_FEE_PATTERNS.some(p => p.test(lower))) {
      const s = WEAZ_BUSINESS;
      return {
        handled: true,
        reply: `Delivery fee is ₹${s.deliveryFee} for orders below ₹${s.freeDeliveryAbove}. Free delivery for orders of ₹${s.freeDeliveryAbove} and above! 🚀`,
        intent: 'faq',
        language: lang,
      };
    }

    // 8. Service area FAQ
    if (SERVICE_AREA_PATTERNS.some(p => p.test(lower))) {
      const areas = WEAZ_BUSINESS.serviceAreas.join(', ');
      return {
        handled: true,
        reply: `We currently deliver in: ${areas}. More areas coming soon! 📍`,
        intent: 'faq',
        language: lang,
      };
    }

    // 9. Delivery time FAQ
    if (DELIVERY_TIME_PATTERNS.some(p => p.test(lower))) {
      return {
        handled: true,
        reply: `Weaz delivers in approximately ${WEAZ_BUSINESS.estimatedDeliveryMinutes} minutes within our service areas! ⚡`,
        intent: 'faq',
        language: lang,
      };
    }

    // 10. Human handoff
    if (HUMAN_HANDOFF_PATTERNS.some(p => p.test(lower))) {
      return {
        handled: true,
        reply: "I'm connecting you to a human agent. A support team member will respond shortly. You can also describe your issue and I'll create a support ticket.",
        intent: 'human_handoff',
        language: lang,
        actions: [{ type: 'handoff', payload: {} }],
      };
    }

    // Not handled — needs Groq
    return { handled: false };
  }
}
