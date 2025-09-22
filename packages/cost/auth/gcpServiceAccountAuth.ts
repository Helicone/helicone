/**
 * Google Service Account JWT Authentication for Cloudflare Workers
 * Based on: https://gist.github.com/markelliot/6627143be1fc8209c9662c504d0ff205
 */

import {
  CacheProvider,
  Result,
  TokenWithTTL,
} from "../../common/cache/provider";

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Convert string to ArrayBuffer
 */
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Convert ArrayBuffer to base64url
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Convert object to base64url-encoded JSON
 */
function objectToBase64url(obj: any): string {
  return arrayBufferToBase64Url(str2ab(JSON.stringify(obj)));
}

/**
 * Sign content with private key using RS256
 */
async function signJWT(content: string, privateKey: string): Promise<string> {
  // Clean the private key
  const plainKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/(\r\n|\n|\r)/gm, "");

  // Convert to binary
  const binaryKey = str2ab(atob(plainKey));
  const buf = str2ab(content);

  // Import the key
  const signer = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-V1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );

  // Sign the content
  const binarySignature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-V1_5" },
    signer,
    buf
  );

  return arrayBufferToBase64Url(binarySignature);
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get Google OAuth2 access token from service account
 * @param serviceAccountJson - The service account JSON as a string
 * @param orgId - Organization ID for cache isolation
 * @param scopes - Optional scopes, defaults to cloud-platform
 * @param cacheProvider - Required CacheProvider for distributed caching
 * @returns Access token string
 */
export async function getGoogleAccessToken(
  serviceAccountJson: string,
  orgId?: string,
  scopes: string[] = ["https://www.googleapis.com/auth/cloud-platform"],
  cacheProvider?: CacheProvider
): Promise<string> {
  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error(
      `Invalid service account JSON: ${error instanceof Error ? error.message : "Parse error"}`
    );
  }
  const serviceAccountHash = await hashString(serviceAccountJson);
  const cacheKey = `gcp-token:${orgId || "no-org"}:${serviceAccountHash}:${scopes.join(",")}`;

  if (!cacheProvider) {
    const tokenData = await generateGoogleAccessToken(serviceAccount, scopes);
    return tokenData.access_token;
  }

  const tokenGenerator = async (): Promise<
    Result<TokenWithTTL<string>, string>
  > => {
    try {
      const tokenData = await generateGoogleAccessToken(serviceAccount, scopes);
      // Use actual expiration time minus 5 minutes for safety
      const ttl = Math.max(0, tokenData.expires_in - 300);
      const expiresAt = Date.now() + tokenData.expires_in * 1000;
      return {
        data: {
          value: tokenData.access_token,
          ttl: ttl,
          expiresAt: expiresAt,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to generate token",
      };
    }
  };

  const result = await cacheProvider.getAndStoreToken(cacheKey, tokenGenerator);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data!;
}

/**
 * Generate a new Google access token
 */
async function generateGoogleAccessToken(
  serviceAccount: ServiceAccount,
  scopes: string[]
): Promise<GoogleTokenResponse> {
  // Create JWT header
  const header = objectToBase64url({
    alg: "RS256",
    typ: "JWT",
  });

  // Create JWT claims
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiration

  const claims = objectToBase64url({
    iss: serviceAccount.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: exp,
    iat: now,
  });

  // Sign the JWT
  const signatureInput = `${header}.${claims}`;
  const signature = await signJWT(signatureInput, serviceAccount.private_key);
  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(
      `Failed to get Google access token: ${tokenResponse.status} - ${errorText}`
    );
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  return tokenData;
}
