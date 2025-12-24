/**
 * Stripe Model Mapping Utilities
 * 
 * Maps between Helicone's internal model representation (uses dots)
 * and Stripe's expected format (uses hyphens).
 */

/**
 * Interface for mapping between internal and Stripe model formats
 */
export interface StripeModelMapping {
  heliconeModel: string;
  stripeModel: string;
}

/**
 * Static mapping from Helicone internal format to Stripe format
 * This mapping corresponds to the models that have stripeModelId in their ModelConfig.
 */
const HELICONE_TO_STRIPE_MAPPINGS: StripeModelMapping[] = [
  // Anthropic models
  { heliconeModel: "anthropic/claude-3.5-haiku", stripeModel: "anthropic/claude-3-5-haiku" },
  { heliconeModel: "anthropic/claude-3.7-sonnet", stripeModel: "anthropic/claude-3-7-sonnet" },
  { heliconeModel: "anthropic/claude-opus-4", stripeModel: "anthropic/claude-opus-4" },
  { heliconeModel: "anthropic/claude-opus-4.1", stripeModel: "anthropic/claude-opus-4-1" },
  { heliconeModel: "anthropic/claude-sonnet-4", stripeModel: "anthropic/claude-sonnet-4" },
  
  // Google models  
  { heliconeModel: "google/gemini-2.5-flash", stripeModel: "google/gemini-2-5-flash" },
  { heliconeModel: "google/gemini-2.5-flash-lite", stripeModel: "google/gemini-2-5-flash-lite" },
  { heliconeModel: "google/gemini-2.5-pro", stripeModel: "google/gemini-2-5-pro" },
  
  // OpenAI models
  { heliconeModel: "openai/gpt-4.1", stripeModel: "openai/gpt-4-1" },
  { heliconeModel: "openai/gpt-4.1-mini", stripeModel: "openai/gpt-4-1-mini" },
  { heliconeModel: "openai/gpt-4.1-nano", stripeModel: "openai/gpt-4-1-nano" },
  { heliconeModel: "openai/gpt-4o", stripeModel: "openai/gpt-4o" },
  { heliconeModel: "openai/gpt-4o-mini", stripeModel: "openai/gpt-4o-mini" },
  { heliconeModel: "openai/gpt-5", stripeModel: "openai/gpt-5" },
  { heliconeModel: "openai/gpt-5-mini", stripeModel: "openai/gpt-5-mini" },
  { heliconeModel: "openai/gpt-5-nano", stripeModel: "openai/gpt-5-nano" },
  { heliconeModel: "openai/o1-mini", stripeModel: "openai/o1-mini" },
  { heliconeModel: "openai/o3-mini", stripeModel: "openai/o3-mini" },
  { heliconeModel: "openai/o3-pro", stripeModel: "openai/o3-pro" },
  { heliconeModel: "openai/o4-mini", stripeModel: "openai/o4-mini" },
  
  // Perplexity models
  { heliconeModel: "perplexity/sonar-pro", stripeModel: "perplexity/sonar-pro" },
  { heliconeModel: "perplexity/sonar-reasoning", stripeModel: "perplexity/sonar-reasoning" },
  { heliconeModel: "perplexity/sonar-reasoning-pro", stripeModel: "perplexity/sonar-reasoning-pro" },
  { heliconeModel: "perplexity/sonar-deep-research", stripeModel: "perplexity/sonar-deep-research" },
];

/**
 * Create reverse mapping lookup table for efficient access
 */
const stripeToHeliconeMap: Record<string, string> = {};
const heliconeToStripeMap: Record<string, string> = {};

for (const mapping of HELICONE_TO_STRIPE_MAPPINGS) {
  heliconeToStripeMap[mapping.heliconeModel] = mapping.stripeModel;
  stripeToHeliconeMap[mapping.stripeModel] = mapping.heliconeModel;
}

/**
 * Gets all available Stripe model mappings.
 *
 * @returns Array of model mappings with both internal and Stripe formats
 */
export function getAllStripeModelMappings(): StripeModelMapping[] {
  return HELICONE_TO_STRIPE_MAPPINGS.slice(); // Return a copy
}

/**
 * Maps Helicone's internal model format to Stripe's expected format.
 *
 * @param heliconeModel - The internal Helicone model name (e.g., "anthropic/claude-3.5-haiku")
 * @returns The Stripe-formatted model name (e.g., "anthropic/claude-3-5-haiku"), or null if not supported
 * 
 * @example
 * ```typescript
 * mapHeliconeModelToStripe("anthropic/claude-3.5-haiku") // "anthropic/claude-3-5-haiku"
 * mapHeliconeModelToStripe("openai/gpt-4.1") // "openai/gpt-4-1"
 * mapHeliconeModelToStripe("unsupported/model") // null
 * ```
 */
export function mapHeliconeModelToStripe(heliconeModel: string): string | null {
  if (!heliconeModel || typeof heliconeModel !== 'string' || heliconeModel.trim().length === 0) {
    return null;
  }

  const trimmedModel = heliconeModel.trim();
  return heliconeToStripeMap[trimmedModel] || null;
}

/**
 * Maps Stripe's model format to Helicone's internal format.
 *
 * @param stripeModel - The Stripe model name (e.g., "anthropic/claude-3-5-haiku")
 * @returns The internal Helicone model name (e.g., "anthropic/claude-3.5-haiku"), or null if not supported
 * 
 * @example
 * ```typescript
 * mapStripeModelToHelicone("anthropic/claude-3-5-haiku") // "anthropic/claude-3.5-haiku"
 * mapStripeModelToHelicone("openai/gpt-4-1") // "openai/gpt-4.1"
 * mapStripeModelToHelicone("unsupported/model") // null
 * ```
 */
export function mapStripeModelToHelicone(stripeModel: string): string | null {
  if (!stripeModel || typeof stripeModel !== 'string' || stripeModel.trim().length === 0) {
    return null;
  }

  const trimmedModel = stripeModel.trim();
  return stripeToHeliconeMap[trimmedModel] || null;
}

/**
 * Checks if a model is supported in Stripe integration.
 * Accepts models in either Helicone internal format or Stripe format.
 *
 * @param model - The model name to check (in either format)
 * @returns true if the model is supported in Stripe
 * 
 * @example
 * ```typescript
 * isModelSupportedInStripe("anthropic/claude-3.5-haiku") // true (Helicone format)
 * isModelSupportedInStripe("anthropic/claude-3-5-haiku") // true (Stripe format)
 * isModelSupportedInStripe("unsupported/model") // false
 * ```
 */
export function isModelSupportedInStripe(model: string): boolean {
  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    return false;
  }

  const trimmedModel = model.trim();
  return !!(heliconeToStripeMap[trimmedModel] || stripeToHeliconeMap[trimmedModel]);
}

/**
 * Gets all supported Stripe model identifiers.
 *
 * @returns Array of all Stripe model identifiers
 * 
 * @example
 * ```typescript
 * const stripeModels = getAllSupportedStripeModels();
 * console.log(stripeModels.length); // Number of supported models
 * ```
 */
export function getAllSupportedStripeModels(): string[] {
  return HELICONE_TO_STRIPE_MAPPINGS.map(m => m.stripeModel).sort();
}

/**
 * Gets all supported Helicone internal model identifiers.
 *
 * @returns Array of all Helicone internal model identifiers
 * 
 * @example
 * ```typescript
 * const heliconeModels = getAllSupportedHeliconeModels();
 * console.log(heliconeModels.length); // Number of supported models
 * ```
 */
export function getAllSupportedHeliconeModels(): string[] {
  return HELICONE_TO_STRIPE_MAPPINGS.map(m => m.heliconeModel).sort();
}

/**
 * Gets the number of models supported in Stripe integration.
 *
 * @returns The total count of supported models
 */
export function getSupportedModelCount(): number {
  return HELICONE_TO_STRIPE_MAPPINGS.length;
}

// Legacy exports for backward compatibility with existing StripeIntegrationHandler
// These maintain the existing API

/**
 * @deprecated Use mapHeliconeModelToStripe instead
 * Legacy function name for backward compatibility
 */
export const mapModelToStripeFormat = mapHeliconeModelToStripe;

/**
 * @deprecated Use isModelSupportedInStripe instead  
 * Legacy function name for backward compatibility
 */
export const isModelAvailableInStripe = isModelSupportedInStripe;

/**
 * @deprecated Use getAllSupportedStripeModels instead
 * Legacy function name for backward compatibility
 */
export const getAvailableStripeModels = getAllSupportedStripeModels;