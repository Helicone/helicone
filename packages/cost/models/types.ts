/**
 * Core type definitions for the model registry
 */

// Import model name types from each author
import type { AnthropicModelName } from "./authors/anthropic";
import type { OpenAIModelName } from "./authors/openai";
import type { GoogleModelName } from "./authors/google";
import type { MetaLlamaModelName } from "./authors/meta-llama";
import type { MistralModelName } from "./authors/mistralai";
import type { AmazonModelName } from "./authors/amazon";
import type { NvidiaModelName } from "./authors/nvidia";
import type { CohereModelName } from "./authors/cohere";
import type { DeepSeekModelName } from "./authors/deepseek";
import type { PerplexityModelName } from "./authors/perplexity";
import type { XAIModelName } from "./authors/x-ai";
import type { MoonshotModelName } from "./authors/moonshotai";

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
export type AuthorName =
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

const providers = [
  "anthropic",
  "openai",
  // "cohere",
  // "mistral",
  // "deepseek",
  // "perplexity",
  // Cloud providers
  "vertex",
  // "vertex-regional",
  "bedrock",
  // "azure-openai",
  // Aggregators
  // "openrouter",
  // "together",
  // "groq",
  // "fireworks",
  // "replicate",
  // "deepinfra",
  // "chutes",
  // "nextbit",
  // "google-ai-studio",
  // "google-vertex",
  // "nebius",
  // "parasail",
  // "cloudflare",
  // "novita",
  // "xai",
  // "alibaba",
  // "cerebras",
  // "baseten",
  // "hyperbolic",
  // "lambda",
  // "moonshot-ai",
  // "inferencenet",
] as const;

/**
 * Inference providers (where models are hosted)
 */
export type ProviderName = (typeof providers)[number];

/**
 * Endpoint names include provider and optional variant (e.g., "vertex:us", "vertex:global")
 * Format: "provider" or "provider:variant"
 */
export type EndpointName = ProviderName | `${ProviderName}:${string}`;

export interface Model {
  id: ModelName;
  name: string;
  author: AuthorName;
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
  cacheWrite?:
    | number
    | {
        "5m": number;
        "1h": number;
        default?: number;
      }
    | null;
  thinking?: number;
}

export interface ModelEndpoint {
  /** Optional display name for this endpoint */
  name?: string;
  /** The model ID as used by this provider (for managed deployments) */
  providerModelId?: string;
  /** Alternative model reference */
  model?: string;
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

/**
 * Map of provider to endpoint configuration
 */
export type ModelEndpointMap = Record<string, ModelEndpoint>;

export interface AuthorMetadata {
  /** Number of models from this author */
  modelCount: number;
  /** Whether this author is actively supported */
  supported: boolean;
  /** Optional base URL for this author's API */
  baseUrl?: string;
}

export interface AuthorData<TModelName extends string = string> {
  metadata: AuthorMetadata;
  models: Record<TModelName, Model>;
  endpoints: Record<TModelName, ModelEndpointMap>;
}

export interface ProviderEndpoint {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  description?: string;
}

export interface ProviderConfig {
  baseUrl: string;
  auth: "api-key" | "oauth" | "aws-signature" | "azure-ad";
  requiresProjectId?: boolean;
  requiresRegion?: boolean;
  requiresDeploymentName?: boolean;
  regions?: readonly string[];
  apiVersion?: string;
  endpoints: Readonly<Record<string, ProviderEndpoint | string>>;
  buildModelId?: (endpoint: ModelEndpoint, options?: any) => string;
  buildUrl?: (
    baseUrl: string,
    endpoint: ModelEndpoint,
    options?: any
  ) => string;
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
