/**
 * Core type definitions for the model registry
 */

// Import model name types from each author
import type { AnthropicModelName } from './authors/anthropic';
import type { OpenAIModelName } from './authors/openai';
import type { GoogleModelName } from './authors/google';
import type { MetaLlamaModelName } from './authors/meta-llama';
import type { MistralModelName } from './authors/mistralai';
import type { AmazonModelName } from './authors/amazon';
import type { NvidiaModelName } from './authors/nvidia';
import type { CohereModelName } from './authors/cohere';
import type { DeepSeekModelName } from './authors/deepseek';
import type { PerplexityModelName } from './authors/perplexity';
import type { XAIModelName } from './authors/x-ai';
import type { MoonshotModelName } from './authors/moonshotai';

// Re-export for convenience
export type {
  AnthropicModelName,
  OpenAIModelName,
  GoogleModelName,
  MetaLlamaModelName,
  MistralModelName,
  AmazonModelName,
  NvidiaModelName,
  CohereModelName,
  DeepSeekModelName,
  PerplexityModelName,
  XAIModelName,
  MoonshotModelName,
};


/**
 * Comprehensive list of all model names/IDs
 * This is the union of all author-specific model names
 */
export type ModelName =
  | AnthropicModelName
  | OpenAIModelName
  | GoogleModelName
  | MetaLlamaModelName
  | MistralModelName
  | AmazonModelName
  | NvidiaModelName
  | CohereModelName
  | DeepSeekModelName
  | PerplexityModelName
  | XAIModelName
  | MoonshotModelName;

/**
 * Model authors/creators
 */
export type Author =
  | "anthropic"
  | "openai"
  | "google"
  | "meta-llama"
  | "mistralai"
  | "amazon"
  | "microsoft"
  | "nvidia"
  | "cohere"
  | "deepseek"
  | "qwen"
  | "x-ai"
  | "moonshotai"
  | "perplexity";

/**
 * Inference providers (where models are hosted)
 */
export type Provider =
  // Direct providers
  | "anthropic"
  | "openai"
  | "cohere"
  | "mistral"
  | "deepseek"
  | "perplexity"
  // Cloud providers
  | "vertex"
  | "vertex-regional"
  | "bedrock"
  | "azure-openai"
  // Aggregators
  | "openrouter"
  | "together"
  | "groq"
  | "fireworks"
  | "replicate"
  | "deepinfra"
  | "chutes"
  | "nextbit"
  | "google-ai-studio"
  | "google-vertex"
  | "nebius"
  | "parasail"
  | "cloudflare"
  | "novita"
  | "xai"
  | "alibaba"
  | "cerebras"
  | "baseten"
  | "hyperbolic"
  | "lambda"
  | "moonshot-ai"
  | "inferencenet";

export interface Model {
  id: ModelName;
  name: string;
  author: Author;
  description: string;
  contextLength: number;
  maxOutputTokens: number | null;
  created: string;
  modality: Modality;
  tokenizer: Tokenizer;
}

export interface ModelPricing {
  prompt: number;
  completion: number;
  image?: number;
  cacheRead?: number | null;
  cacheWrite?: number | {
    "5m": number;
    "1h": number;
    default?: number;
  } | null;
  thinking?: number;
}

/**
 * Status codes for endpoints
 */
export const EndpointStatus = {
  ACTIVE: 0,
  DEPRECATED: 1,
  BETA: 2,
  COMING_SOON: 3,
} as const;

export type EndpointStatusType =
  (typeof EndpointStatus)[keyof typeof EndpointStatus];

export interface ModelEndpoint {
  /** Optional display name for this endpoint */
  name?: string;
  /** Provider identifier */
  provider: Provider;
  /** The model ID as used by this provider (for managed deployments) */
  providerModelId?: string;
  /** Alternative model reference */
  model?: string;
  /** Tag for categorizing this endpoint (often same as provider) */
  tag?: string;
  /** Status code */
  status?: EndpointStatusType;
  /** Pricing for this model on this provider */
  pricing: ModelPricing;
  /** Maximum context length for this deployment */
  contextLength: number;
  /** Maximum completion tokens for this deployment */
  maxCompletionTokens: number | null;
  /** Parameters supported by this endpoint */
  supportedParameters: StandardParameter[];
  /** For providers like Bedrock: indicates BYOK can use different regions */
  supportsDynamicRegion?: boolean;
  /** For BYOK: base model ID without region prefix */
  baseModelId?: string;
}

export interface AuthorMetadata {
  /** Number of models from this author */
  modelCount: number;
  /** Whether this author is actively supported */
  supported: boolean;
  /** Optional base URL for this author's API */
  baseUrl?: string;
}


export interface AuthorData {
  metadata: AuthorMetadata;
  models: Partial<Record<ModelName, Model>>;
  endpoints: Partial<Record<ModelName, ModelEndpoint[]>>;
}

/**
 * Standard parameter names used across providers
 */
export type StandardParameter =
  // Common parameters
  | "max_tokens"
  | "temperature"
  | "top_p"
  | "top_k"
  | "stop"
  | "stream"
  // Advanced parameters
  | "frequency_penalty"
  | "presence_penalty"
  | "repetition_penalty"
  | "seed"
  // Tool use
  | "tools"
  | "tool_choice"
  | "functions"
  | "function_call"
  // Reasoning/thinking
  | "reasoning"
  | "include_reasoning"
  | "thinking"
  // Response format
  | "response_format"
  | "json_mode";

/**
 * Common modality types
 */
export type Modality =
  | "text"
  | "text->text"
  | "text+image->text"
  | "text->image"
  | "multimodal";

/**
 * Common tokenizer types
 */
export type Tokenizer =
  | "Claude"
  | "GPT"
  | "Llama"
  | "Llama3"
  | "Llama4"
  | "Gemini"
  | "Mistral"
  | "Qwen"
  | "DeepSeek"
  | "Cohere"
  | "Grok";
