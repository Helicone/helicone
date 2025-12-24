/**
 * Simple in-memory cache with FIFO eviction.
 * Singleton pattern to maintain cache across requests within a worker instance.
 *
 * This is in a separate file to allow importing without pulling in the full
 * worker source tree (which causes issues with vitest-pool-workers).
 */
export class InMemoryCache<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: InMemoryCache<any>;
  private cache: Map<string, T>;
  private maxEntries: number;

  private constructor(maxEntries = 100) {
    this.cache = new Map<string, T>();
    this.maxEntries = maxEntries;
  }

  public static getInstance<T>(maxEntries = 100): InMemoryCache<T> {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache<T>(maxEntries);
    }
    return InMemoryCache.instance;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Helper function to clear all provider keys from the in-memory cache.
 * Used primarily in tests to ensure cache doesn't leak between test cases.
 */
export function clearProviderKeysInMemoryCache(): void {
  const cache = InMemoryCache.getInstance<unknown>();
  cache.clear();
}
