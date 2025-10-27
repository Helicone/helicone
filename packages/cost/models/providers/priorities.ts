import type { ModelProviderName } from "./index";

/**
 * Provider priority configuration
 * Lower number = higher priority in the AI gateway routing
 *
 * Priority levels:
 * - 1: BYOK (Bring Your Own Key) - Reserved for user's own API keys
 * - 2: Helicone Provider - Helicone-hosted inference endpoints
 * - 3: Anthropic & OpenAI - Direct provider endpoints for premium providers
 * - 4: Other providers - All other third-party providers (default)
 */
export const PROVIDER_PRIORITIES: Record<ModelProviderName, number> = {
  // Priority 1: BYOK (Bring Your Own Key) - Reserved for user's own API keys

  // Priority 2: Helicone-hosted inference
  helicone: 2,

  // Priority 3: Premium direct providers
  anthropic: 3,
  openai: 3,

  // Priority 4: All other providers (default)
  azure: 4,
  bedrock: 4,
  chutes: 4,
  cohere: 4,
  deepinfra: 4,
  deepseek: 4,
  "google-ai-studio": 4,
  groq: 4,
  nebius: 4,
  novita: 4,

  perplexity: 4,
  vertex: 4,
  xai: 4,

  // Priority 10: OpenRouter - for fallback only
  openrouter: 10,
} as const;

/**
 * Default priority for providers not explicitly configured
 */
export const DEFAULT_PROVIDER_PRIORITY = 4;

/**
 * Get the default priority for a provider
 */
export function getProviderPriority(provider: ModelProviderName): number {
  return PROVIDER_PRIORITIES[provider] ?? DEFAULT_PROVIDER_PRIORITY;
}
