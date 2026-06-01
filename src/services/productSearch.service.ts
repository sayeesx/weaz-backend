import { ProductDTO } from './product.service';

/**
 * Multi-language product alias map.
 * Maps common terms (English, Malayalam, Manglish, Hindi, Hinglish, Unicode) to canonical search terms.
 */
const PRODUCT_ALIASES: Record<string, string[]> = {
  onion: ['onion', 'onions', 'savala', 'ulli', 'pyaz', 'pyaaz', 'प्याज', 'സവാള', 'ഉള്ളി'],
  tomato: ['tomato', 'tomatoes', 'thakkali', 'tamatar', 'टमाटर', 'തക്കാളി'],
  potato: ['potato', 'potatoes', 'urulakizhangu', 'aloo', 'aaloo', 'आलू', 'ഉരുളക്കിഴങ്ങ്'],
  milk: ['milk', 'paal', 'doodh', 'dudh', 'दूध', 'പാലു', 'പാൽ'],
  bread: ['bread', 'ബ്രെഡ്', 'roti'],
  egg: ['egg', 'eggs', 'mutta', 'anda', 'अंडा', 'മുട്ട'],
  banana: ['banana', 'bananas', 'pazham', 'kela', 'केला', 'നേന്ത്രപ്പഴം', 'പഴം'],
  rice: ['rice', 'ari', 'chawal', 'chaval', 'चावल', 'അരി'],
  chicken: ['chicken', 'kozhi', 'murga', 'murgi', 'चिकन', 'കോഴി'],
  fish: ['fish', 'meen', 'machli', 'machhi', 'मछली', 'മീൻ'],
  oil: ['oil', 'enna', 'tel', 'तेल', 'എണ്ണ', 'sunflower', 'coconut oil'],
  butter: ['butter', 'venna', 'makhan', 'मक्खन', 'വെണ്ണ'],
  salt: ['salt', 'uppu', 'namak', 'नमक', 'ഉപ്പ്'],
  sugar: ['sugar', 'panjara', 'cheeni', 'चीनी', 'പഞ്ചസാര'],
  noodles: ['noodles', 'maggi', 'noodle'],
  chips: ['chips', 'lays', 'chip', 'snacks'],
  soap: ['soap', 'sabun', 'handwash', 'detergent', 'surfexcel', 'surf excel'],
  toothpaste: ['toothpaste', 'pepsodent', 'colgate'],
  juice: ['juice', 'aamras', 'paper boat'],
};

// Build reverse map: alias → canonical
const aliasToCanonical = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(PRODUCT_ALIASES)) {
  for (const alias of aliases) {
    aliasToCanonical.set(alias.toLowerCase(), canonical);
  }
}

/** Normalize text for search */
const normalize = (text: string): string =>
  text.toLowerCase().trim().replace(/\s+/g, ' ');

/** Match a single term against product aliases, returning matching products */
export const matchProductByAlias = (term: string, products: ProductDTO[]): ProductDTO[] => {
  const normalized = normalize(term);
  const canonical = aliasToCanonical.get(normalized);

  if (canonical) {
    // Get all alias terms for this canonical
    const allTerms = PRODUCT_ALIASES[canonical] || [canonical];
    return products.filter(p => {
      const pName = p.name.toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      return allTerms.some(t => pName.includes(t) || pDesc.includes(t)) ||
        pName.includes(canonical);
    });
  }

  // Direct substring match
  return products.filter(p => {
    const pName = p.name.toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    return pName.includes(normalized) || pDesc.includes(normalized) || pCat.includes(normalized);
  });
};

/** Search products with multi-language alias support */
export const searchProducts = (query: string, products: ProductDTO[]): ProductDTO[] => {
  const q = normalize(query);
  if (!q) return [];

  // Try alias match first
  const aliasResults = matchProductByAlias(q, products);
  if (aliasResults.length > 0) return aliasResults;

  // Split query into words and try each
  const words = q.split(/[\s,]+/).filter(Boolean);
  const resultSet = new Set<string>();
  const results: ProductDTO[] = [];

  for (const word of words) {
    if (word.length < 2) continue;
    const matched = matchProductByAlias(word, products);
    for (const p of matched) {
      if (!resultSet.has(p.id)) {
        resultSet.add(p.id);
        results.push(p);
      }
    }
  }

  return results;
};

/** Quantity parsing patterns */
const QTY_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos)/i,
  /(\d+(?:\.\d+)?)\s*(?:g|gram|grams)/i,
  /(\d+(?:\.\d+)?)\s*(?:l|litre|liter|litres|liters)/i,
  /(\d+(?:\.\d+)?)\s*(?:ml|millilitre|milliliter)/i,
  /(\d+(?:\.\d+)?)\s*(?:packets?|packs?|pieces?|pcs?|items?|units?|nos?|bottles?|boxes?|bags?)/i,
  /(\d+(?:\.\d+)?)\s*(?:dozen|doz)/i,
];

/** Parse quantity from message text near a product mention */
export const parseQuantity = (message: string): number => {
  const lower = message.toLowerCase();
  for (const pattern of QTY_PATTERNS) {
    const match = lower.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  // Look for standalone numbers
  const numMatch = lower.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n <= 100) return n;
  }
  return 1; // default
};

export interface ExtractedCartItem {
  product: ProductDTO;
  quantity: number;
  confidence: number;
}

/**
 * Extract cart items from a natural language message.
 * e.g. "I need 2 kg onions and 1 milk packet" → [{ product: Onion, qty: 2 }, { product: Milk, qty: 1 }]
 */
export const extractCartItemsFromMessage = (
  message: string,
  products: ProductDTO[]
): ExtractedCartItem[] => {
  const items: ExtractedCartItem[] = [];
  const lower = normalize(message);
  const segments = lower.split(/(?:and|aur|um|,|&)+/).map(s => s.trim()).filter(Boolean);

  for (const segment of segments) {
    // Find which products match this segment
    const matched = matchProductByAlias(segment, products);
    if (matched.length > 0) {
      const qty = parseQuantity(segment);
      // Pick the best match (first available)
      const best = matched.find(p => p.isAvailable) || matched[0];
      if (best) {
        items.push({
          product: best,
          quantity: qty,
          confidence: matched.length === 1 ? 0.9 : 0.7,
        });
      }
    }
  }

  // If no segments matched, try full message as one query
  if (items.length === 0) {
    const allWords = lower.split(/[\s,]+/).filter(w => w.length >= 3);
    for (const word of allWords) {
      const matched = matchProductByAlias(word, products);
      if (matched.length > 0) {
        const best = matched.find(p => p.isAvailable) || matched[0];
        if (best && !items.find(i => i.product.id === best.id)) {
          items.push({
            product: best,
            quantity: parseQuantity(lower),
            confidence: 0.6,
          });
        }
      }
    }
  }

  return items;
};
