import { Env, hash } from "..";
import { Result, ok } from "../results";

export interface SecureCacheEnv {
  SECURE_CACHE: Env["SECURE_CACHE"];
  REQUEST_CACHE_KEY: Env["REQUEST_CACHE_KEY"];
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

export async function storeInCache(
  key: string,
  value: string,
  env: SecureCacheEnv
): Promise<void> {
  const encrypted = await encrypt(value, env);
  await env.SECURE_CACHE.put(await hash(key), JSON.stringify(encrypted), {});
}

export async function getFromCache(
  key: string,
  env: SecureCacheEnv
): Promise<string | null> {
  const hashedKey = await hash(key);
  const encrypted = await env.SECURE_CACHE.get(hashedKey, {
    cacheTtl: 3600,
  });
  if (!encrypted) {
    return null;
  }

  return decrypt(JSON.parse(encrypted), env);
}

export async function getAndStoreInCache<T, K>(
  key: string,
  env: SecureCacheEnv,
  fn: () => Promise<Result<T, K>>
): Promise<Result<T, K>> {
  const cached = await getFromCache(key, env);
  if (cached !== null) {
    const cachedResult = JSON.parse(cached);
    if (cachedResult._helicone_cached_string) {
      return ok(cachedResult._helicone_cached_string);
    }
    return ok(JSON.parse(cached) as T);
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
