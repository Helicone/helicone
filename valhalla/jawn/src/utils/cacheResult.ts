import { KVCache } from "../lib/cache/kvCache";
import { Result } from "../lib/shared/result";
import { stringToNumberHash } from "../utils/helpers";

const kvCache = new KVCache(24 * 60 * 60 * 1000); // 24 hours

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
