import { hash } from "../../..";
import { safePut } from "../../safePut";
import { Result, ok } from "../results";
import {
  CacheProvider,
  TokenWithTTL,
} from "../../../../../packages/common/cache/provider";

const hashWithHmac = async (key: string, hmac_key: 1 | 2) => {
  const hashedKey = await hash(hmac_key === 1 ? key : `${key}_2`);
  return hashedKey;
};

export interface SecureCacheEnv {
  SECURE_CACHE: Env["SECURE_CACHE"];
  REQUEST_CACHE_KEY: Env["REQUEST_CACHE_KEY"];
  REQUEST_CACHE_KEY_2: Env["REQUEST_CACHE_KEY_2"];
}

class InMemoryCache<T> {
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

async function getCacheKey(
  env: SecureCacheEnv,
  hmac_key: 1 | 2 = 2
): Promise<CryptoKey> {
  // Convert the hexadecimal key to a byte array
  const keyBytes = Buffer.from(
    hmac_key === 1 ? env.REQUEST_CACHE_KEY : env.REQUEST_CACHE_KEY_2,
    "hex"
  );

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  text: string,
  env: SecureCacheEnv,
  hmac_key: 1 | 2
): Promise<{ iv: string; content: string }> {
  const key = getCacheKey(env, hmac_key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    await key,
    encoded
  );

  return {
    iv: Buffer.from(iv).toString("hex"),
    content: Buffer.from(encryptedContent).toString("hex"),
  };
}

export async function decrypt(
  encrypted: {
    iv: string;
    content: string;
  },
  env: SecureCacheEnv,
  hmac_key: 1 | 2
): Promise<string | null> {
  try {
    const key = getCacheKey(env, hmac_key);
    const iv = Buffer.from(encrypted.iv, "hex");
    const encryptedContent = Buffer.from(encrypted.content, "hex");

    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      await key,
      new Uint8Array(encryptedContent)
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.error("Error decrypting cache", e);
    return null;
  }
}

export async function removeFromCache(
  key: string,
  env: SecureCacheEnv
): Promise<void> {
  const hashedKey1 = await hashWithHmac(key, 1);
  const hashedKey2 = await hashWithHmac(key, 2);
  await Promise.all([
    env.SECURE_CACHE.delete(hashedKey1),
    env.SECURE_CACHE.delete(hashedKey2),
  ]);
  InMemoryCache.getInstance<string>().delete(hashedKey1);
  InMemoryCache.getInstance<string>().delete(hashedKey2);
}

async function storeInCacheWithHmac({
  key,
  value,
  env,
  hmac_key,
  expirationTtl,
  useMemoryCache = true,
}: {
  key: string;
  value: string;
  env: SecureCacheEnv;
  hmac_key: 1 | 2;
  expirationTtl?: number;
  useMemoryCache?: boolean;
}): Promise<void> {
  const encrypted = await encrypt(value, env, hmac_key);
  const hashedKey = await hashWithHmac(key, hmac_key);
  const ttlToUse = expirationTtl ?? 600;
  try {
    await safePut({
      key: env.SECURE_CACHE,
      keyName: hashedKey,
      value: JSON.stringify(encrypted),
      options: {
        expirationTtl: ttlToUse,
      },
    });
  } catch (e) {
    console.error("Error storing in cache", e);
  }
  if (useMemoryCache) {
    InMemoryCache.getInstance<string>().set(
      hashedKey,
      JSON.stringify(encrypted)
    );
  }
}

export async function storeInCache(
  key: string,
  value: string,
  env: SecureCacheEnv,
  expirationTtl?: number,
  useMemoryCache: boolean = true
): Promise<void> {
  await Promise.all([
    storeInCacheWithHmac({
      key,
      value,
      env,
      hmac_key: 1,
      expirationTtl,
      useMemoryCache,
    }),
    await storeInCacheWithHmac({
      key,
      value,
      env,
      hmac_key: 2,
      expirationTtl,
      useMemoryCache,
    }),
  ]);
}

async function getFromCacheWithHmac({
  key,
  env,
  hmac_key,
  useMemoryCache,
  expirationTtl,
}: {
  key: string;
  env: SecureCacheEnv;
  hmac_key: 1 | 2;
  useMemoryCache?: boolean;
  expirationTtl?: number;
}): Promise<string | null> {
  try {
    const hashedKey = await hashWithHmac(key, hmac_key);
    if (useMemoryCache) {
      const encryptedMemory =
        InMemoryCache.getInstance<string>().get(hashedKey);
      if (encryptedMemory !== undefined) {
        return decrypt(JSON.parse(encryptedMemory), env, hmac_key);
      }
    }
    const encryptedRemote = await env.SECURE_CACHE.get(hashedKey, {
      cacheTtl: expirationTtl ?? 60 * 60, // 1 hour
    });
    if (!encryptedRemote) {
      return null;
    }

    return decrypt(JSON.parse(encryptedRemote), env, hmac_key);
  } catch (e) {
    console.error("Error getting from cache", e);
    return null;
  }
}

export async function getFromCache({
  key,
  env,
  useMemoryCache,
  expirationTtl,
}: {
  key: string;
  env: SecureCacheEnv;
  useMemoryCache?: boolean;
  expirationTtl?: number;
}): Promise<string | null> {
  const [value1, value2] = await Promise.all([
    getFromCacheWithHmac({
      key,
      env,
      hmac_key: 1,
      useMemoryCache,
      expirationTtl,
    }),
    getFromCacheWithHmac({
      key,
      env,
      hmac_key: 2,
      useMemoryCache,
      expirationTtl,
    }),
  ]);
  if (value2) {
    return value2;
  }
  return value1;
}

export async function getFromKVCacheOnly(
  key: string,
  env: SecureCacheEnv,
  expirationTtl?: number
): Promise<string | null> {
  return getFromCache({
    key,
    env,
    useMemoryCache: false,
    expirationTtl: 60, // 1 minute
  });
}

export async function getAndStoreInCache<T, K>(
  key: string,
  env: SecureCacheEnv,
  fn: () => Promise<Result<T, K>>,
  expirationTtl?: number,
  useMemoryCache: boolean = true
): Promise<Result<T, K>> {
  const cached = await getFromCache({
    key,
    env,
    useMemoryCache: false,
    expirationTtl: 60, // 1 minute
  });
  if (cached !== null) {
    try {
      console.log("cached with key", key, cached);
      const cachedResult = JSON.parse(cached);
      if (cachedResult._helicone_cached_string) {
        return ok(cachedResult._helicone_cached_string);
      }
      return ok(JSON.parse(cached) as T);
    } catch (e) {
      console.error("Error parsing cached result", e);
    }
  }
  console.log("not cached with key", key);
  const value = await fn();
  if (value.error !== null) {
    return value;
  }
  if (typeof value.data === "string") {
    await storeInCache(
      key,
      JSON.stringify({ _helicone_cached_string: value.data }),
      env,
      expirationTtl,
      useMemoryCache
    );
    return value;
  } else {
    await storeInCache(
      key,
      JSON.stringify(value.data),
      env,
      expirationTtl,
      useMemoryCache
    );
  }
  return value;
}

/**
 * SecureCacheProvider implements the CacheProvider interface
 * to provide caching capabilities across the worker instances
 */
export class SecureCacheProvider implements CacheProvider {
  constructor(
    private readonly env: SecureCacheEnv,
    private readonly useMemoryCache: boolean = true
  ) {}

  async getAndStoreToken<T, K>(
    key: string,
    fn: () => Promise<Result<TokenWithTTL<T>, K>>
  ): Promise<Result<T, K>> {
    // Check cache first
    const cached = await getFromCache({
      key,
      env: this.env,
      useMemoryCache: this.useMemoryCache,
      expirationTtl: 60, // 1 minute for checking
    });

    if (cached !== null) {
      try {
        const cachedResult = JSON.parse(cached);

        // Check if token is expired
        if (cachedResult.expiresAt && cachedResult.expiresAt <= Date.now()) {
          console.log(`Token expired for key ${key}, regenerating...`);
          // Token is expired, fall through to regenerate
        } else {
          // Token is still valid
          if (cachedResult._helicone_cached_string) {
            return ok(cachedResult._helicone_cached_string);
          }
          if (cachedResult.value) {
            return ok(cachedResult.value as T);
          }
          return ok(cachedResult as T);
        }
      } catch (e) {
        console.error("Error parsing cached result", e);
      }
    }

    // Generate new token with TTL
    const result = await fn();
    if (result.error !== null) {
      return { data: null, error: result.error };
    }

    const { value, ttl, expiresAt } = result.data!;

    // Store with expiration timestamp and dynamic TTL
    const dataToCache = {
      value: value,
      expiresAt: expiresAt,
      _helicone_cached_string: typeof value === "string" ? value : undefined,
    };

    await storeInCache(
      key,
      JSON.stringify(dataToCache),
      this.env,
      ttl,
      this.useMemoryCache
    );

    return ok(value);
  }
}
