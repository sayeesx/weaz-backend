import { supabaseAdmin } from '../config/supabase';
import { CacheService } from './cache.service';
import { WEAZ_BUSINESS, WeazSettings } from '../config/weaz';

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
}

const KB_CACHE_KEY = 'weaz:knowledge_base';
const KB_TTL = 600; // 10 min

export class BusinessService {
  /** Get Weaz business settings (from config constant, not DB) */
  static getSettings(): WeazSettings {
    return WEAZ_BUSINESS;
  }

  /** Get knowledge base articles, cached */
  static async getKnowledgeBase(): Promise<KnowledgeBaseEntry[]> {
    const { data } = await CacheService.getOrSet<KnowledgeBaseEntry[]>(
      KB_CACHE_KEY,
      KB_TTL,
      async () => {
        const { data: kb, error } = await supabaseAdmin
          .from('knowledge_base')
          .select('id, title, content, category, language')
          .eq('is_active', true);
        if (error) {
          console.error('Failed to load knowledge base:', error.message);
          return [];
        }
        return (kb || []) as KnowledgeBaseEntry[];
      }
    );
    return data;
  }

  /** Get full business context for AI */
  static async getBusinessContext() {
    const settings = this.getSettings();
    const kb = await this.getKnowledgeBase();
    return { settings, kb };
  }

  /** Invalidate knowledge base cache */
  static async invalidateKBCache() {
    await CacheService.del(KB_CACHE_KEY);
  }
}
