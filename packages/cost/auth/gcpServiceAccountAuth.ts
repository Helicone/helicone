/**
 * Google Service Account JWT Authentication for Cloudflare Workers
 * Based on: https://gist.github.com/markelliot/6627143be1fc8209c9662c504d0ff205
 */

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

// Cache for access tokens (in-memory per worker instance)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

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
 * Get Google OAuth2 access token from service account
 * @param serviceAccountJson - The service account JSON as a string
 * @param scopes - Optional scopes, defaults to cloud-platform
 * @returns Access token string
 */
export async function getGoogleAccessToken(
  serviceAccountJson: string,
  scopes: string[] = ["https://www.googleapis.com/auth/cloud-platform"]
): Promise<string> {
  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
  const cacheKey = `${serviceAccount.client_email}:${scopes.join(",")}`;

  // Check cache first
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

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

  // Cache the token (expire 5 minutes early to be safe)
  tokenCache.set(cacheKey, {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 300) * 1000,
  });

  return tokenData.access_token;
}

/**
 * Clear the token cache (useful for testing or force refresh)
 */
export function clearGoogleTokenCache(): void {
  tokenCache.clear();
}
