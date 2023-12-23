export class CacheItem<T> {
  constructor(public value: T, public expiry: number) {}
}

export class InMemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  constructor(private maxEntries = 100) {}

  // Sets a value in the cache with a TTL (in milliseconds)
  set<T>(key: string, value: T, ttl: number): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    const expiry = Date.now() + ttl;
    this.cache.set(key, new CacheItem(value, expiry));
    setTimeout(() => this.removeIfExpired(key), ttl);
  }

  // Retrieves a value from the cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  // Removes a key from the cache if it's expired
  private removeIfExpired(key: string): void {
    const item = this.cache.get(key);
    if (item && item.expiry < Date.now()) {
      this.cache.delete(key);
    }
  }
}
