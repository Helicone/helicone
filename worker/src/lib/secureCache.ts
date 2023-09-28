import { Env, hash } from "..";

async function getCacheKey(env: Env): Promise<CryptoKey> {
  // Convert the hexadecimal key to a byte array
  const keyBytes = Buffer.from(env.REQUEST_CACHE_KEY, "hex");

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  text: string,
  env: Env
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
  env: Env
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
  env: Env
): Promise<void> {
  const encrypted = await encrypt(value, env);
  await env.SECURE_CACHE.put(await hash(key), JSON.stringify(encrypted), {
    expirationTtl: 60 * 60 * 10, // 10 minutes
  });
}

export async function getFromCache(
  key: string,
  env: Env
): Promise<string | null> {
  const encrypted = await env.SECURE_CACHE.get(await hash(key));
  if (!encrypted) {
    return null;
  }
  return decrypt(JSON.parse(encrypted), env);
}
