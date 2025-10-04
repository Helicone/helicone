import { Cloudflare } from "cloudflare";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

const cloudflare = new Cloudflare({
  apiToken: SecretManager.getSecret("CLOUDFLARE_API_TOKEN"),
});

const hashWithHmac = async (key: string, hmac_key: 1 | 2) => {
  const hashedKey = await hash(hmac_key === 1 ? key : `${key}_2`);
  return hashedKey;
};

export async function safePut({
  keyName,
  value,
  maxRetries = 3,
  currentRetry = 0,
  baseDelay = 1_000,
  expirationTTL = 600,
}: {
  keyName: string;
  value: string;
  maxRetries?: number;
  currentRetry?: number;
  baseDelay?: number;
  expirationTTL?: number;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.CLOUDFLARE_KV_NAMESPACE_ID) {
      throw new Error("CLOUDFLARE_KV_NAMESPACE_ID is not set");
    }
    await cloudflare.kv.namespaces.values.update(
      process.env.CLOUDFLARE_KV_NAMESPACE_ID,
      keyName,
      // value,
      {
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
        expiration_ttl: expirationTTL,
        value: value,
      },
    );

    return { success: true };
  } catch (e) {
    console.error(
      `Error putting in cache (attempt ${currentRetry + 1}/${maxRetries})`,
      e,
    );
    if (currentRetry >= maxRetries) {
      return { success: false, error: JSON.stringify(e) };
    }

    const delay = Math.floor(
      baseDelay * Math.pow(2, currentRetry) * (0.5 + Math.random()),
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    return safePut({
      keyName,
      value,
      maxRetries,
      currentRetry: currentRetry + 1,
      baseDelay,
      expirationTTL,
    });
  }
}

export async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key),
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

async function getCacheKey(): Promise<CryptoKey> {
  const requestCacheKey = SecretManager.getSecret("REQUEST_CACHE_KEY");
  if (!requestCacheKey) {
    throw new Error("REQUEST_CACHE_KEY is not set");
  }
  // Convert the hexadecimal key to a byte array
  const keyBytes = Buffer.from(requestCacheKey, "hex");

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
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

export async function removeFromCache(key: string): Promise<void> {
  const hashedKey = await hashWithHmac(key, 2);
  await cloudflare.kv.namespaces.values.delete(
    process.env.CLOUDFLARE_KV_NAMESPACE_ID ?? "",
    hashedKey,
    {
      account_id: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    },
  );
}

export async function storeInCache(
  key: string,
  value: string,
  expirationTtl?: number,
): Promise<void> {
  const encrypted = await encrypt(value);
  const hashedKey = await hashWithHmac(key, 2);
  const ttlToUse = expirationTtl ?? 600;
  try {
    await safePut({
      keyName: hashedKey,
      value: JSON.stringify(encrypted),
      expirationTTL: ttlToUse,
    });
  } catch (e) {
    console.error("Error storing in cache", e);
  }
}
