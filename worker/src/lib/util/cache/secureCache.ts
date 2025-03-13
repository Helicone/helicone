import { Env, hash } from "../../..";
import { safePut } from "../../safePut";
import { Result, ok } from "../results";

export interface SecureCacheEnv {
  SECURE_CACHE: Env["SECURE_CACHE"];
  REQUEST_CACHE_KEY: Env["REQUEST_CACHE_KEY"];
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
      this.cache.delete(firstKey);
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

async function getCacheKey(env: SecureCacheEnv): Promise<CryptoKey> {
  // Convert the hexadecimal key to a byte array
  const keyBytes = Buffer.from(env.REQUEST_CACHE_KEY, "hex");

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  text: string,
  env: SecureCacheEnv
): Promise<{ iv: string; content: string }> {
  const key = getCacheKey(env);
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
  env: SecureCacheEnv
): Promise<string> {
  const key = getCacheKey(env);
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
}

async function storeInCache(
  key: string,
  value: string,
  env: SecureCacheEnv
): Promise<void> {
  const encrypted = await encrypt(value, env);
  const hashedKey = await hash(key);
  try {
    await safePut({
      key: env.SECURE_CACHE,
      keyName: hashedKey,
      value: JSON.stringify(encrypted),
      options: {
        // 10 minutes
        expirationTtl: 600,
      },
    });
  } catch (e) {
    console.log("Error storing in cache", e);
  }
  InMemoryCache.getInstance<string>().set(hashedKey, JSON.stringify(encrypted));
}

export async function getFromCache(
  key: string,
  env: SecureCacheEnv
): Promise<string | null> {
  const hashedKey = await hash(key);
  const encryptedMemory = InMemoryCache.getInstance<string>().get(hashedKey);
  if (encryptedMemory !== undefined) {
    return decrypt(JSON.parse(encryptedMemory), env);
  }

  const encryptedRemote = await env.SECURE_CACHE.get(hashedKey, {
    cacheTtl: 3600,
  });
  if (!encryptedRemote) {
    return null;
  }

  return decrypt(JSON.parse(encryptedRemote), env);
}

export async function getAndStoreInCache<T, K>(
  key: string,
  env: SecureCacheEnv,
  fn: () => Promise<Result<T, K>>
): Promise<Result<T, K>> {
  const cached = await getFromCache(key, env);
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
      env
    );
    return value;
  } else {
    await storeInCache(key, JSON.stringify(value.data), env);
  }
  return value;
}
