interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

interface CacheItem<T> {
  data: T;
  expires: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 300;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;

    this.cache.set(prefixedKey, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async cacheDashboardData(tenantId: string, data: any): Promise<void> {
    await this.set(`dashboard:${tenantId}`, data, { ttl: 300 });
  }

  async getDashboardData(tenantId: string): Promise<any | null> {
    return this.get(`dashboard:${tenantId}`);
  }

  async cacheThreatAnalytics(
    tenantId: string,
    timeframe: string,
    data: any,
  ): Promise<void> {
    await this.set(`threats:${tenantId}:${timeframe}`, data, { ttl: 120 });
  }

  async getThreatAnalytics(
    tenantId: string,
    timeframe: string,
  ): Promise<any | null> {
    return this.get(`threats:${tenantId}:${timeframe}`);
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const entry of entries) {
      const [key, item] = entry;
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  constructor() {
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
}

export const cache = CacheManager.getInstance();
