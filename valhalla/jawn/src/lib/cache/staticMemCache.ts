import { hashAuth } from "../../utils/hash";
import { redisClient } from "../clients/redisClient";
import { Result, ok } from "../../packages/common/result";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

export class CacheItem<T> {
  constructor(
    public value: T,
    public expiry: number,
  ) {}
}

export class InMemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private checkInterval: number = 60000; // Interval to check for expired items, e.g., every 60 seconds

  constructor(private maxEntries: number) {
    this.startCleanupTimer();
  }

  // Sets a value in the cache with a TTL (in milliseconds)
  set<T>(key: string, value: T, ttl: number): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    const expiry = Date.now() + ttl;
    this.cache.set(key, new CacheItem(value, expiry));
  }

  // Starts a timer to periodically clean up expired items
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      for (let [key, item] of this.cache.entries()) {
        if (item.expiry < now) {
          this.cache.delete(key);
        }
      }
    }, this.checkInterval);
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
}

class ProviderKeyCache extends InMemoryCache {
  private static instance: ProviderKeyCache;

  constructor() {
    super(1_000);
  }

  static getInstance(): ProviderKeyCache {
    if (!ProviderKeyCache.instance) {
      ProviderKeyCache.instance = new ProviderKeyCache();
    }
    return ProviderKeyCache.instance;
  }
  // 5 minutes
  set<T>(key: string, value: T, ttl: number = 300_000): void {
    super.set(key, value, ttl);
  }
}

export async function storeInCache(
  key: string,
  value: string,
  ttl: number = 600,
): Promise<void> {
  const encrypted = await encrypt(value);
  const hashedKey = await hashAuth(key);
  try {
    // redis
    await redisClient?.set(hashedKey, JSON.stringify(encrypted), "EX", ttl);
  } catch (e) {
    console.error("Error storing in cache", e);
  }

  ProviderKeyCache.getInstance().set<string>(
    hashedKey,
    JSON.stringify(encrypted),
  );
}

export async function getFromCache(key: string): Promise<string | null> {
  const hashedKey = await hashAuth(key);
  const encryptedMemory = ProviderKeyCache.getInstance().get<string>(hashedKey);
  if (encryptedMemory) {
    return decrypt(JSON.parse(encryptedMemory));
  }

  try {
    const encryptedRemote = await redisClient?.get(hashedKey);
    if (!encryptedRemote) {
      return null;
    }
    return decrypt(JSON.parse(encryptedRemote));
  } catch (e) {
    console.error("Error decrypting cached result", e);
    return null;
  }
}

export async function getAndStoreInCache<T, K>(
  key: string,
  fn: () => Promise<Result<T, K>>,
  ttl: number = 600,
): Promise<Result<T, K>> {
  const cached = await getFromCache(key);
  if (cached !== null) {
    try {
      const cachedResult = JSON.parse(cached);
      if (cachedResult._helicone_cached_string) {
        return ok(cachedResult._helicone_cached_string);
      }
      return ok(JSON.parse(cached) as T);
    } catch (e) {
      console.log("Error parsing cached result", e);
    }
  }
  const value = await fn();
  if (value.error !== null) {
    return value;
  }
  if (typeof value.data === "string") {
    await storeInCache(
      key,
      JSON.stringify({ _helicone_cached_string: value.data }),
      ttl,
    );
    return value;
  } else {
    await storeInCache(key, JSON.stringify(value.data), ttl);
  }
  return value;
}

export async function encrypt(
  text: string,
): Promise<{ iv: string; content: string }> {
  const key = getCacheKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    await key,
    encoded,
  );

  return {
    iv: Buffer.from(iv).toString("hex"),
    content: Buffer.from(encryptedContent).toString("hex"),
  };
}

export async function decrypt(encrypted: {
  iv: string;
  content: string;
}): Promise<string> {
  const key = getCacheKey();
  const iv = Buffer.from(encrypted.iv, "hex");
  const encryptedContent = Buffer.from(encrypted.content, "hex");

  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    await key,
    new Uint8Array(encryptedContent),
  );

  return new TextDecoder().decode(decryptedContent);
}

async function getCacheKey(): Promise<CryptoKey> {
  // Convert the hexadecimal key to a byte array
  const requestCacheKey = SecretManager.getSecret("REQUEST_CACHE_KEY");
  if (!requestCacheKey) {
    throw new Error("REQUEST_CACHE_KEY is not set");
  }

  const keyBytes = Buffer.from(requestCacheKey, "hex");

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );
    return cryptoKey;
  } catch (error) {
    throw new Error("Failed to import key");
  }
}
