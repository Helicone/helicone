/**
 * Builds the header set sent to an upstream LLM provider.
 *
 * The inbound request carries Helicone credentials (helicone-auth, Helicone
 * API keys or proxy keys in Authorization / x-api-key), Helicone control
 * headers (helicone-*, __helicone-mock-response) and edge metadata (cookies,
 * client IPs). None of that belongs to the provider, so outbound headers are
 * built from an allowlist instead of copying the inbound set and deleting
 * what we remember to delete.
 *
 * Kept dependency-free so it can be unit tested without the worker graph.
 */
import { HELICONE_API_KEY_REGEX } from "../util/apiKeyRegex";

// Exact header names providers need.
const ALLOWED_HEADERS = new Set<string>([
  "accept",
  "accept-encoding",
  "accept-language",
  "content-type",
  "content-encoding",
  "content-length",
  "user-agent",
  "idempotency-key",
  "cache-control",
  "host",
  // credentials (values are still screened for Helicone keys below)
  "authorization",
  "x-api-key",
  "api-key",
  // provider specific
  "http-referer", // OpenRouter attribution
  "x-title", // OpenRouter attribution
  "x-client-name", // Cohere
]);

// Header name prefixes providers and their SDKs use.
const ALLOWED_PREFIXES = [
  "openai-", // openai-organization, openai-project, openai-beta
  "anthropic-", // anthropic-version, anthropic-beta, ...
  "x-stainless-", // OpenAI / Anthropic SDK telemetry
  "x-goog-", // x-goog-api-key, x-goog-user-project
  "x-vertex-", // Vertex AI request options
  "x-amz-", // SigV4 (Bedrock)
  "x-amzn-", // Bedrock options
  "x-ms-", // Azure
  "azureml-", // Azure ML deployments
  "upstash-", // QStash
  "x-fireworks-",
  "x-cohere-",
];

const HELICONE_KEY_PREFIX = /^[sp]k-helicone-/i;

/**
 * True when a header value carries a Helicone credential (API key, proxy key,
 * customer-portal key), alone, as a Bearer token, or in a comma separated list.
 */
export function containsHeliconeKey(value: string | null | undefined): boolean {
  if (!value) return false;
  return value
    .split(/[\s,]+/)
    .filter((part) => part.length > 0 && part.toLowerCase() !== "bearer")
    .some(
      (part) =>
        HELICONE_KEY_PREFIX.test(part) ||
        HELICONE_API_KEY_REGEX.some((pattern) => pattern.test(part))
    );
}

export function isAllowedProviderHeader(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith("helicone-") || lower.startsWith("__helicone")) {
    return false;
  }
  if (ALLOWED_HEADERS.has(lower)) return true;
  return ALLOWED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Returns a fresh Headers object containing only allowlisted headers from
 * each source, in order (later sources win). Any header whose value carries a
 * Helicone key is dropped regardless of its name.
 */
export function buildProviderRequestHeaders(
  ...sources: (Headers | null | undefined)[]
): Headers {
  const out = new Headers();
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of source.entries()) {
      if (!isAllowedProviderHeader(key)) continue;
      if (containsHeliconeKey(value)) continue;
      out.set(key, value);
    }
  }
  return out;
}
