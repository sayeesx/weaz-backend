import { supabaseAdmin } from '../config/supabase';
import { CacheService } from './cache.service';

/**
 * Product DTO — normalized from actual DB schema.
 * REAL DB uses: name (not title), stock_quantity (not stock), is_available (not visibility)
 * No slug column, no categories table, no cloudinary_image_url
 */
export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  unit: string | null;
  category: string | null;
  isAvailable: boolean;
  tags: string[] | null;
}

const PRODUCTS_CACHE_KEY = 'weaz:products';
const PRODUCTS_TTL = 180; // 3 min

export class ProductService {
  /** Load all available products, cached */
  static async getAllProducts(): Promise<ProductDTO[]> {
    const { data } = await CacheService.getOrSet<ProductDTO[]>(
      PRODUCTS_CACHE_KEY,
      PRODUCTS_TTL,
      async () => {
        const { data: products, error } = await supabaseAdmin
          .from('products')
          .select('id, name, description, unit, price, stock_quantity, is_available, category, tags')
          .eq('is_available', true)
          .order('name', { ascending: true });

        if (error || !products) return [];

        return products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || null,
          price: Number(p.price || 0),
          stock: p.stock_quantity ?? 0,
          unit: p.unit || null,
          category: p.category || null,
          isAvailable: p.is_available === true && (p.stock_quantity ?? 0) > 0,
          tags: p.tags || null,
        }));
      }
    );
    return data;
  }

  /** Search products by query */
  static async searchProducts(search?: string, category?: string): Promise<ProductDTO[]> {
    const all = await this.getAllProducts();
    let results = all;

    if (category) {
      const catLower = category.toLowerCase();
      results = results.filter(p =>
        p.category?.toLowerCase() === catLower
      );
    }

    if (search) {
      const q = search.toLowerCase().trim();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /** Get single product by ID */
  static async getProductById(productId: string): Promise<ProductDTO | null> {
    const all = await this.getAllProducts();
    return all.find(p => p.id === productId) || null;
  }

  /** Get distinct categories from products */
  static async getCategories(): Promise<string[]> {
    const all = await this.getAllProducts();
    const cats = new Set<string>();
    all.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }

  /** Invalidate products cache */
  static async invalidateCache() {
    await CacheService.invalidateGroup([PRODUCTS_CACHE_KEY]);
  }
}
