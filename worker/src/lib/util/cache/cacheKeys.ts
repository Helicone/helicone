/**
 * Cache key prefixes and TTLs for auth, vault and limit lookups.
 *
 * Bump a prefix whenever the cached value's meaning or the code that
 * produced it changes in a security-relevant way: entries written under the
 * old prefix are simply never read again and age out of KV.
 *
 * v2 / authParams4 (vault pinning + revocation fix): entries written before
 * this change were cached for 12 hours, did not carry the provider name
 * needed for target pinning, skipped the org check on proxy-key lookups, and
 * included soft-deleted organizations. They are abandoned on deploy.
 */
export const CACHE_KEY_PREFIXES = {
  authParams: "authParams4-",
  customerPortalKey: "getProxy-CP-v2-",
  proxyKey: "getProxyKey-v2-",
  rateLimitPolicies: "rateLimitOptions-v2-",
  organization: "org-v4-",
  providerKeys: "provider_keys_v2_",
  apiKeys: "api_keys_v2_",
} as const;

/**
 * Upper bound for anything that grants access: auth params, decrypted keys,
 * org/proxy-key limits. A revoked key or deleted org stops working within
 * this window (plus up to 60s of KV edge caching).
 */
export const AUTH_CACHE_TTL_SECONDS = 300;

/** Failed vault lookups are remembered briefly (KV minimum is 60s). */
export const VAULT_NEGATIVE_CACHE_TTL_SECONDS = 60;

/** Response cache key version; bump to abandon all cached responses. */
export const RESPONSE_CACHE_KEY_VERSION = "v2";
