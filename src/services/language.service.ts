/**
 * Detect dominant language of user message.
 * Uses Unicode range heuristics + keyword matching.
 */

const MALAYALAM_RE = /[\u0D00-\u0D7F]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;

const MANGLISH_KEYWORDS = [
  'undo', 'venam', 'entha', 'ethra', 'evide', 'enna', 'aanu',
  'enthanu', 'eniku', 'njan', 'ningal', 'cheyyam', 'pattilla',
  'mathram', 'kuzhappam', 'sahayam', 'paisa', 'veedu', 'kadal',
  'onnu', 'randu', 'moonu', 'nalu', 'anchu', 'aaru', 'ezhu',
  'ettu', 'onpathu', 'patthu', 'venda', 'pore', 'mathi',
  'kittum', 'tharum', 'kittumo', 'edukkam', 'kodukkam', 'vazhi',
  'evidanu', 'evidey', 'enthu', 'aaranu', 'athalle',
];

const HINGLISH_KEYWORDS = [
  'chahiye', 'chahte', 'karo', 'bhai', 'yaar', 'kaha', 'kaise',
  'kitna', 'kitne', 'dena', 'lena', 'mangta', 'nahi', 'haan',
  'milega', 'dikhao', 'batao', 'mujhe', 'mereko', 'apna',
  'wala', 'waali', 'rakhna', 'bhejdo', 'bhejo', 'dijiye',
  'lagega', 'lagta', 'paisa', 'rupees', 'rupaye',
];

export type DetectedLanguage = 'en' | 'ml' | 'hi' | 'mixed';

export const detectLanguage = (text: string): DetectedLanguage => {
  const hasMalayalam = MALAYALAM_RE.test(text);
  const hasDevanagari = DEVANAGARI_RE.test(text);

  if (hasMalayalam && hasDevanagari) return 'mixed';
  if (hasMalayalam) return 'ml';
  if (hasDevanagari) return 'hi';

  // Check for transliterated keywords
  const lower = text.toLowerCase();
  const words = lower.split(/[\s,.\-!?]+/);

  let manglishScore = 0;
  let hinglishScore = 0;
  for (const w of words) {
    if (MANGLISH_KEYWORDS.includes(w)) manglishScore++;
    if (HINGLISH_KEYWORDS.includes(w)) hinglishScore++;
  }

  if (manglishScore > 0 && hinglishScore > 0) return 'mixed';
  if (manglishScore > 0) return 'ml';
  if (hinglishScore > 0) return 'hi';

  return 'en';
};
