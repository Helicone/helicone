/**
 * Model-centric type definitions for Helicone's cost system
 * Following TypeScript best practices:
 * - Using const assertions for literal types
 * - Favoring interfaces for extensibility
 * - Using discriminated unions where appropriate
 * - Keeping it simple and focused on core functionality
 */

// Using const assertion for immutable creator list
export const MODEL_CREATORS = [
  "OpenAI",
  "Anthropic", 
  "Google",
  "Meta",
  "DeepSeek",
  "Mistral",
  "Cohere",
  "xAI",
  "Nvidia",
  "Alibaba",
  "01.AI",
  "Qwen",
] as const;

export type ModelCreator = typeof MODEL_CREATORS[number];

// Provider names - where models can be accessed
export const PROVIDER_NAMES = [
  "openai",
  "azure", 
  "anthropic",
  "bedrock",
  "google-vertex-ai",
  "openrouter",
  "deepseek",
  "together",
  "groq",
  "perplexity",
  "mistral",
  "cohere",
  "xAI",
  "meta",
  "nvidia",
  "nebius",
  "novita",
  "vercel",
  "fireworks",
  "qstash",
  "avian",
] as const;

export type ProviderName = typeof PROVIDER_NAMES[number];

// Core cost structure - reusing existing pattern
export interface ModelCost {
  prompt_token: number;
  completion_token: number;
  // Optional costs
  prompt_cache_write_token?: number;
  prompt_cache_read_token?: number;
  prompt_audio_token?: number;
  completion_audio_token?: number;
  per_image?: number;
  per_call?: number;
}

// Rate limit structure
export interface RateLimit {
  tpm?: number; // Tokens per minute
  rpm?: number; // Requests per minute
  rpd?: number; // Requests per day
  tpd?: number; // Tokens per day (batch)
  imagesPerMinute?: number; // For image models
}

// Provider implementation for a specific model
export interface ProviderImplementation {
  provider: ProviderName;
  available: boolean;
  cost: ModelCost;
  // Optional fields
  modelString?: string; // How provider names this model
  endpoint?: string;
  notes?: string;
  rateLimit?: RateLimit; // Rate limits for this specific provider
}

// Core model metadata - keeping it simple
export interface ModelMetadata {
  displayName: string;
  description: string;
  contextWindow: number;
  maxOutputTokens?: number;
  releaseDate: string;
  deprecatedDate?: string;
}

// Base model interface - contains all required fields
export interface BaseModel {
  id: string;
  creator: ModelCreator;
  metadata: ModelMetadata;
  providers: Record<string, ProviderImplementation>;
  slug: string;
}

// Model variant interface - only stores differences from base
export interface ModelVariant {
  id: string;
  baseModelId: string;
  // Optional overrides
  providers?: Record<string, ProviderImplementation>;
  metadata?: Partial<ModelMetadata>;
}

// Model registry with separated base models and variants
export interface ModelRegistry {
  models: Record<string, BaseModel>;
  variants: Record<string, ModelVariant>;
}

// Resolved model - what you get after merging base + variant
export interface ResolvedModel extends BaseModel {
  baseModelId?: string; // Set if this was resolved from a variant
}

// Flat lookup map for O(1) access to any model ID
export interface ModelLookupMap {
  [modelId: string]: {
    type: 'model' | 'variant';
    data: BaseModel | ResolvedModel;
  };
}

// Computed indices for efficient lookups
export interface ModelIndices {
  // Provider → Model IDs
  byProvider: Map<ProviderName, Set<string>>;
  
  // Creator → Model IDs
  byCreator: Map<ModelCreator, Set<string>>;
  
  // Quick model lookup by various identifiers
  byAlias: Map<string, string>; // alias → canonical model ID
}

// Provider summary for provider pages
export interface ProviderSummary {
  provider: ProviderName;
  modelCount: number;
  models: Array<{
    modelId: string;
    creator: ModelCreator;
    displayName: string;
    cost: ModelCost;
    available: boolean;
    contextWindow: number;
  }>;
}

// Model cost with provider context
export interface ModelProviderCost {
  modelId: string;
  displayName: string;
  creator: ModelCreator;
  providers: Array<{
    provider: ProviderName;
    cost: ModelCost;
    available: boolean;
    endpoint?: string;
    rateLimit?: RateLimit;
  }>;
}

// Provider configuration with organization-level limits
export interface ProviderConfig {
  provider: ProviderName;
  monthlyUsageLimit?: number; // e.g., $200,000 for OpenAI
  globalRateLimits?: {
    defaultModels?: RateLimit; // Default limits for models not specified
  };
}