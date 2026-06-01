import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';

export class CacheService {
  /** Get parsed JSON from cache. Returns null on miss or error. */
  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const r = getRedis();
      if (!r) return null;
      const val = await r.get<T>(key);
      return val ?? null;
    } catch (err) {
      logger.warn({ key }, 'Redis GET failed, falling back');
      return null;
    }
  }

  /** Set JSON value with TTL in seconds */
  static async setJSON(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const r = getRedis();
      if (!r) return;
      await r.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch (err) {
      logger.warn({ key }, 'Redis SET failed');
    }
  }

  /** Delete a cache key */
  static async del(key: string): Promise<void> {
    try {
      const r = getRedis();
      if (!r) return;
      await r.del(key);
    } catch {
      // ignore
    }
  }

  /** Get from cache or fetch from the provided function, caching the result */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<{ data: T; fromCache: boolean }> {
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    const data = await fetcher();
    // Don't await cache set — fire and forget
    this.setJSON(key, data, ttlSeconds).catch(() => {});
    return { data, fromCache: false };
  }

  /** Invalidate multiple keys by pattern prefix */
  static async invalidateGroup(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  }
}
