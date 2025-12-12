/**
 * Stripe Model Mapping Layer
 * 
 * Maps between Helicone's internal model representation (uses dots)
 * and Stripe's expected format (uses hyphens).
 * 
 * Helicone Internal Format: "anthropic/claude-3.5-haiku"
 * Stripe Format: "anthropic/claude-3-5-haiku"
 */

/**
 * Mapping from Stripe format to Helicone internal format
 * Key: Stripe model identifier (with hyphens)
 * Value: Helicone internal model identifier (with dots)
 */
const STRIPE_TO_HELICONE_MAPPING: { [key: string]: string } = {
  // Anthropic models
  "anthropic/claude-3-5-haiku": "anthropic/claude-3.5-haiku",
  "anthropic/claude-haiku-4-5": "anthropic/claude-haiku-4.5",
  "anthropic/claude-3-7-sonnet": "anthropic/claude-3.7-sonnet",
  "anthropic/claude-3-haiku": "anthropic/claude-3-haiku", // No dots to convert
  "anthropic/claude-opus-4": "anthropic/claude-opus-4", // No dots to convert
  "anthropic/claude-opus-4-1": "anthropic/claude-opus-4.1",
  "anthropic/claude-sonnet-4": "anthropic/claude-sonnet-4", // No dots to convert
  "anthropic/claude-sonnet-4-5": "anthropic/claude-sonnet-4.5",
  "anthropic/claude-sonnet-4-above200k": "anthropic/claude-sonnet-4-above200k", // No dots to convert
  
  // Google Gemini models
  "google/gemini-2-0-flash": "google/gemini-2.0-flash",
  "google/gemini-2-0-flash-lite": "google/gemini-2.0-flash-lite",
  "google/gemini-2-5-flash": "google/gemini-2.5-flash",
  "google/gemini-2-5-flash-audio": "google/gemini-2.5-flash-audio",
  "google/gemini-2-5-flash-image-preview": "google/gemini-2.5-flash-image-preview",
  "google/gemini-2-5-flash-lite": "google/gemini-2.5-flash-lite",
  "google/gemini-2-5-flash-lite-audio": "google/gemini-2.5-flash-lite-audio",
  "google/gemini-2-5-flash-preview-native-audio-dialog": "google/gemini-2.5-flash-preview-native-audio-dialog",
  "google/gemini-2-5-flash-preview-native-audio-dialog-audio": "google/gemini-2.5-flash-preview-native-audio-dialog-audio",
  "google/gemini-2-5-flash-preview-native-audio-dialog-audio-video": "google/gemini-2.5-flash-preview-native-audio-dialog-audio-video",
  "google/gemini-2-5-flash-preview-tts": "google/gemini-2.5-flash-preview-tts",
  "google/gemini-2-5-pro": "google/gemini-2.5-pro",
  "google/gemini-2-5-pro-above200k": "google/gemini-2.5-pro-above200k",
  "google/gemini-2-5-pro-preview-tts": "google/gemini-2.5-pro-preview-tts",
  "google/gemini-live-2-5-flash-preview": "google/gemini-live-2.5-flash-preview",
  "google/gemini-live-2-5-flash-preview-audio": "google/gemini-live-2.5-flash-preview-audio",
  "google/gemini-live-2-5-flash-preview-audio-video": "google/gemini-live-2.5-flash-preview-audio-video",
  
  // OpenAI models
  "openai/gpt-4-1": "openai/gpt-4.1",
  "openai/gpt-4-1-mini": "openai/gpt-4.1-mini",
  "openai/gpt-4-1-nano": "openai/gpt-4.1-nano",
  "openai/gpt-4o": "openai/gpt-4o", // No dots to convert
  "openai/gpt-4o-mini": "openai/gpt-4o-mini", // No dots to convert
  "openai/gpt-5": "openai/gpt-5", // No dots to convert
  "openai/gpt-5-mini": "openai/gpt-5-mini", // No dots to convert
  "openai/gpt-5-nano": "openai/gpt-5-nano", // No dots to convert
  "openai/o1": "openai/o1", // No dots to convert
  "openai/o1-mini": "openai/o1-mini", // No dots to convert
  "openai/o1-pro": "openai/o1-pro", // No dots to convert
  "openai/o3": "openai/o3", // No dots to convert
  "openai/o3-mini": "openai/o3-mini", // No dots to convert
  "openai/o3-pro": "openai/o3-pro", // No dots to convert
  "openai/o4-mini": "openai/o4-mini", // No dots to convert
  
  // Perplexity models
  "perplexity/sonar-reasoning-pro": "perplexity/sonar-reasoning-pro", // No dots to convert
  "perplexity/sonar-pro": "perplexity/sonar-pro", // No dots to convert
  "perplexity/sonar-deep-research": "perplexity/sonar-deep-research", // No dots to convert
  "perplexity/sonar-reasoning": "perplexity/sonar-reasoning", // No dots to convert
  "perplexity/sonar": "perplexity/sonar", // No dots to convert
};

/**
 * Mapping from Helicone internal format to Stripe format
 * Reverse mapping for efficiency
 */
const HELICONE_TO_STRIPE_MAPPING: { [key: string]: string } = {};
for (const stripeModel in STRIPE_TO_HELICONE_MAPPING) {
  if (STRIPE_TO_HELICONE_MAPPING.hasOwnProperty(stripeModel)) {
    const heliconeModel = STRIPE_TO_HELICONE_MAPPING[stripeModel];
    HELICONE_TO_STRIPE_MAPPING[heliconeModel] = stripeModel;
  }
}

/**
 * Object containing all valid Stripe model identifiers for O(1) lookup
 */
const AVAILABLE_STRIPE_MODELS_OBJECT: { [key: string]: boolean } = {};
for (const model in STRIPE_TO_HELICONE_MAPPING) {
  if (STRIPE_TO_HELICONE_MAPPING.hasOwnProperty(model)) {
    AVAILABLE_STRIPE_MODELS_OBJECT[model] = true;
  }
}

/**
 * Object containing all valid Helicone internal model identifiers for O(1) lookup
 */
const AVAILABLE_HELICONE_MODELS_OBJECT: { [key: string]: boolean } = {};
for (const model in HELICONE_TO_STRIPE_MAPPING) {
  if (HELICONE_TO_STRIPE_MAPPING.hasOwnProperty(model)) {
    AVAILABLE_HELICONE_MODELS_OBJECT[model] = true;
  }
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
  
  // Direct lookup first (most efficient)
  const directMapping = HELICONE_TO_STRIPE_MAPPING[trimmedModel];
  if (directMapping) {
    return directMapping;
  }

  // Fallback: simple dot-to-hyphen replacement for models not in explicit mapping
  const convertedModel = trimmedModel.replace(/\./g, "-");
  
  // Only return if the converted model is in our allowed set
  if (AVAILABLE_STRIPE_MODELS_OBJECT[convertedModel]) {
    return convertedModel;
  }

  return null;
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
  
  // Direct lookup
  const mapping = STRIPE_TO_HELICONE_MAPPING[trimmedModel];
  return mapping || null;
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
  
  // Check if it's already in Stripe format
  if (AVAILABLE_STRIPE_MODELS_OBJECT[trimmedModel]) {
    return true;
  }
  
  // Check if it's in Helicone format and can be mapped to Stripe
  if (AVAILABLE_HELICONE_MODELS_OBJECT[trimmedModel]) {
    return true;
  }
  
  // Fallback check with simple conversion
  const convertedModel = trimmedModel.replace(/\./g, "-");
  return AVAILABLE_STRIPE_MODELS_OBJECT[convertedModel] || false;
}

/**
 * Gets all supported Stripe model identifiers.
 *
 * @returns Array of all Stripe model identifiers
 * 
 * @example
 * ```typescript
 * const stripeModels = getAllSupportedStripeModels();
 * console.log(stripeModels.length); // 46
 * ```
 */
export function getAllSupportedStripeModels(): string[] {
  const models: string[] = [];
  for (const model in AVAILABLE_STRIPE_MODELS_OBJECT) {
    if (AVAILABLE_STRIPE_MODELS_OBJECT.hasOwnProperty(model)) {
      models.push(model);
    }
  }
  return models.sort();
}

/**
 * Gets all supported Helicone internal model identifiers.
 *
 * @returns Array of all Helicone internal model identifiers
 * 
 * @example
 * ```typescript
 * const heliconeModels = getAllSupportedHeliconeModels();
 * console.log(heliconeModels.length); // 46
 * ```
 */
export function getAllSupportedHeliconeModels(): string[] {
  const models: string[] = [];
  for (const model in AVAILABLE_HELICONE_MODELS_OBJECT) {
    if (AVAILABLE_HELICONE_MODELS_OBJECT.hasOwnProperty(model)) {
      models.push(model);
    }
  }
  return models.sort();
}

/**
 * Gets the number of models supported in Stripe integration.
 *
 * @returns The total count of supported models
 */
export function getSupportedModelCount(): number {
  return Object.keys(AVAILABLE_STRIPE_MODELS_OBJECT).length;
}

// Legacy exports for backward compatibility
// These maintain the existing API from StripeIntegrationHandler

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