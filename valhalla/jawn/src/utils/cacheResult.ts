import { KVCache } from "../lib/cache/kvCache";
import { Result } from "../packages/common/result";
import { stringToNumberHash } from "../utils/helpers";

const kvCache = new KVCache(24 * 60 * 60 * 1000); // 24 hours

const shortCache = new KVCache(60 * 1000 * 5); // 5 minutes

function getCacheKey(text: string): string {
  return `cache:${stringToNumberHash(text)}`;
}

export async function cacheResult<T, K>(
  cacheKeyMiddle: string,
  fn: () => Promise<Result<T, K>>,
  ...args: any[]
): Promise<Result<T, K>> {
  return cacheResultCustom(cacheKeyMiddle, fn, kvCache, ...args);
}

export async function cacheResultCustom<T, K>(
  cacheKeyMiddle: string,
  fn: () => Promise<Result<T, K>>,
  kvCache: KVCache,
  ...args: any[]
): Promise<Result<T, K>> {
  const cacheKey = getCacheKey(JSON.stringify(args) + cacheKeyMiddle);

  const cachedValue = await kvCache.get(cacheKey);
  if (cachedValue) {
    console.log("Cache hit for", cacheKey);
    return cachedValue as Result<T, K>;
  }

  const result = await fn();
  if (result.data) {
    kvCache.set(cacheKey, result).catch((err) => {
      console.error("Failed to set cache:", err);
    });
  }

  return result;
}

/**
 * Returns the cached value if it exists, otherwise returns the result of the function.
 *
 * if there is a cached value, it returns the cached value but then in the background fetches
 * the result of the function and updates the cache.
 *
 * NOTE: we use shortCache kind of like a debounce to prevent re-requests from hurtting a wittle db
 */
export async function quickCacheResultCustom<T, K>(
  cacheKeyMiddle: string,
  fn: () => Promise<Result<T, K>>,
  kvCache: KVCache,
  ...args: any[]
): Promise<Result<T, K>> {
  const cacheKey = getCacheKey(JSON.stringify(args) + cacheKeyMiddle);

  const cachedValue = await kvCache.get(cacheKey);

  // The short cache is used to reduce really fast re-requests of the same data
  const shortCachedValue = await shortCache.get(cacheKey);
  if (shortCachedValue) {
    console.log("Short cache hit for", cacheKey);
    return shortCachedValue as Result<T, K>;
  }
  const result = fn();
  const resultWithCache = result.then((r) => {
    if (r.data) {
      kvCache.set(cacheKey, r).catch((err) => {
        console.error("Failed to set cache:", err);
      });
      shortCache.set(cacheKey, r).catch((err) => {
        console.error("Failed to set short cache:", err);
      });
    }
    return r;
  });
  if (cachedValue) {
    console.log("Cache hit for", cacheKey);
    return cachedValue as Result<T, K>;
  }

  return resultWithCache;
}
