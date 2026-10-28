/**
 * First-party origins for credentials Helicone holds on a customer's behalf.
 *
 * `approvedDomains` (./mappings.ts) answers "may a caller-supplied target be
 * proxied at all?". It deliberately includes multi-tenant suffixes
 * (*.openai.azure.com, *.azure-api.net, gateway.ai.cloudflare.com, ...) and
 * small third-party hosts, because a caller sending *their own* key there is
 * their business.
 *
 * A key Helicone decrypted from the vault (proxy keys, customer-portal keys,
 * AI Gateway BYOK) is different: the caller never saw it, so it must only ever
 * reach the provider it belongs to. Any tenant can stand up an Azure resource,
 * an APIM instance, or a Cloudflare AI Gateway and read what arrives there, so
 * those suffixes are never acceptable for a vault key. Azure keys are pinned to
 * the endpoint stored in the key's own config.
 *
 * Every rule here matches a full origin (scheme + host, default port only) and
 * requires https.
 */

type OriginRule = string | RegExp;

const OPENAI: OriginRule[] = [
  "https://api.openai.com",
  "https://us.api.openai.com",
];
const ANTHROPIC: OriginRule[] = ["https://api.anthropic.com"];
const GOOGLE_AI_STUDIO: OriginRule[] = [
  "https://generativelanguage.googleapis.com",
];
// https://aiplatform.googleapis.com and https://{region}-aiplatform.googleapis.com
const VERTEX: OriginRule[] = [
  /^https:\/\/([a-z0-9]+(-[a-z0-9]+)*-)?aiplatform\.googleapis\.com$/,
];
// https://bedrock-runtime.{region}.amazonaws.com (and the FIPS variant)
const BEDROCK: OriginRule[] = [
  /^https:\/\/bedrock-runtime(-fips)?\.[a-z0-9]+(-[a-z0-9]+)*\.amazonaws\.com$/,
];
const XAI: OriginRule[] = ["https://api.x.ai"];
const TOGETHER: OriginRule[] = ["https://api.together.xyz"];

const FIRST_PARTY_ORIGINS: Record<string, OriginRule[]> = {
  openai: OPENAI,
  anthropic: ANTHROPIC,
  "google-ai-studio": GOOGLE_AI_STUDIO,
  vertex: VERTEX,
  bedrock: BEDROCK,
  xai: XAI,
  together: TOGETHER,
  mistral: ["https://api.mistral.ai"],
  groq: ["https://api.groq.com"],
  deepseek: ["https://api.deepseek.com"],
  perplexity: ["https://api.perplexity.ai"],
  deepinfra: ["https://api.deepinfra.com"],
  openrouter: ["https://openrouter.ai", "https://api.openrouter.ai"],
  novita: ["https://api.novita.ai"],
  baseten: ["https://inference.baseten.co"],
  fireworks: ["https://api.fireworks.ai"],
  cerebras: ["https://api.cerebras.ai"],
  nebius: ["https://api.tokenfactory.nebius.com"],
  canopywave: ["https://inference.canopywave.io"],
  flexai: ["https://api.flex.ai"],
  chutes: ["https://llm.chutes.ai", "https://api.chutes.ai"],
  cohere: ["https://api.cohere.ai", "https://api.cohere.com"],
  llama: ["https://api.llama.com"],
  nvidia: ["https://integrate.api.nvidia.com"],
  hyperbolic: ["https://api.hyperbolic.xyz"],
  vercel: ["https://ai-gateway.vercel.sh"],
  helicone: ["https://inference.helicone.ai"],
};

// Provider names as they appear in provider_keys.provider_name (lower-cased),
// legacy proxy-router names, and ProviderName values from ./mappings.ts.
const PROVIDER_ALIASES: Record<string, string> = {
  google: "google-ai-studio",
  gemini: "google-ai-studio",
  "google-ai": "google-ai-studio",
  "vertex-ai": "vertex",
  aws: "bedrock",
  "aws-bedrock": "bedrock",
  x: "xai",
  grok: "xai",
  "together-ai": "together",
  togetherai: "together",
  "azure-openai": "azure",
  azureopenai: "azure",
};

export function normalizeVaultProviderName(
  providerName: string | null | undefined,
): string {
  const lower = (providerName ?? "").trim().toLowerCase();
  return PROVIDER_ALIASES[lower] ?? lower;
}

function ruleMatches(rule: OriginRule, origin: string): boolean {
  return typeof rule === "string" ? rule === origin : rule.test(origin);
}

/**
 * Parses `target` and returns its origin when it is a plain https URL with no
 * userinfo and no explicit port. Anything else returns null.
 */
export function strictHttpsOrigin(target: string | URL): string | null {
  let url: URL;
  try {
    url = typeof target === "string" ? new URL(target) : new URL(target.href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port !== "") return null;
  return url.origin.toLowerCase();
}

/** Origins configured on an Azure key (baseUri / endpoint / resourceName). */
export function azureConfiguredOrigins(config: unknown): string[] {
  if (!config || typeof config !== "object") return [];
  const c = config as Record<string, unknown>;
  const origins: string[] = [];
  for (const field of ["baseUri", "baseURL", "baseUrl", "endpoint"]) {
    const value = c[field];
    if (typeof value === "string" && value.trim() !== "") {
      const origin = strictHttpsOrigin(value.trim());
      if (origin) origins.push(origin);
    }
  }
  const resourceName = c["resourceName"];
  if (
    typeof resourceName === "string" &&
    /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/i.test(resourceName)
  ) {
    origins.push(`https://${resourceName.toLowerCase()}.openai.azure.com`);
  }
  return origins;
}

/**
 * Providers we have no first-party entry for (legacy "portal" / custom keys)
 * may only reach a single-tenant first-party API host, never a tenant
 * controllable one.
 */
const ALL_FIRST_PARTY_RULES: OriginRule[] =
  Object.values(FIRST_PARTY_ORIGINS).flat();

export function hasFirstPartyEntry(providerName: string | null | undefined) {
  const name = normalizeVaultProviderName(providerName);
  return name === "azure" || name in FIRST_PARTY_ORIGINS;
}

/**
 * True when a credential belonging to `providerName` may be sent to `target`.
 *
 * - https only, no userinfo, default port only.
 * - Azure: only the origin stored in the key's config.
 * - Known providers: only that provider's first-party origins.
 * - Unknown provider names: only single-tenant first-party origins.
 */
export function isFirstPartyTargetForProvider(
  providerName: string | null | undefined,
  config: unknown,
  target: string | URL,
): boolean {
  const origin = strictHttpsOrigin(target);
  if (!origin) return false;

  const name = normalizeVaultProviderName(providerName);
  if (name === "azure") {
    return azureConfiguredOrigins(config).includes(origin);
  }

  const rules = FIRST_PARTY_ORIGINS[name] ?? ALL_FIRST_PARTY_RULES;
  return rules.some((rule) => ruleMatches(rule, origin));
}
