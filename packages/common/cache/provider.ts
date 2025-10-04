/**
 * Cache provider interfaces for cross-package caching
 */

// Result type for cache operations
export interface Result<T, E> {
  data: T | null;
  error: E | null;
}

/**
 * Token with TTL information for dynamic caching
 */
export interface TokenWithTTL<T> {
  value: T;
  ttl: number; // TTL in seconds
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Cache provider interface using the getAndStoreInCache pattern
 * This pattern checks cache, calls function if needed, and stores result atomically
 */
export interface CacheProvider {
  /**
   * Method for caching tokens with dynamic TTL
   * The generator function returns both the token and its TTL
   */
  getAndStoreToken<T, K>(
    key: string,
    fn: () => Promise<Result<TokenWithTTL<T>, K>>,
  ): Promise<Result<T, K>>;
}
