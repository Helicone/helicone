/**
 * Core type definitions for the flat model registry
 */

// ============= Model Name Types =============

// Import all model name types from authors
import { AmazonModelName, type AmazonEndpointId } from "./authors/amazon";
import type { AnthropicModelName } from "./authors/anthropic/models";
import type { AnthropicEndpointId } from "./authors/anthropic/endpoints";
import { CohereModelName, type CohereEndpointId } from "./authors/cohere";
import { DeepSeekModelName, type DeepSeekEndpointId } from "./authors/deepseek";
import { GoogleModelName, type GoogleEndpointId } from "./authors/google";
import { GroqModelName, type GroqEndpointId } from "./authors/groq";
import {
  MetaLlamaModelName,
  type MetaLlamaEndpointId,
} from "./authors/meta-llama";
import { MistralModelName, type MistralEndpointId } from "./authors/mistralai";
import {
  MoonshotModelName,
  type MoonshotEndpointId,
} from "./authors/moonshotai";
import { NvidiaModelName, type NvidiaEndpointId } from "./authors/nvidia";
import { OpenAIModelName, type OpenAIEndpointId } from "./authors/openai";
import {
  PerplexityModelName,
  type PerplexityEndpointId,
} from "./authors/perplexity";
import { XAIModelName, type XAIEndpointId } from "./authors/x-ai";

// Union of all model names
export type ModelName =
  | AnthropicModelName
  | OpenAIModelName
  | PerplexityModelName
  | XAIModelName
  | AmazonModelName
  | CohereModelName
  | DeepSeekModelName
  | GoogleModelName
  | GroqModelName
  | MetaLlamaModelName
  | MistralModelName
  | MoonshotModelName
  | NvidiaModelName;

// Union of all endpoint IDs
export type EndpointId =
  | AnthropicEndpointId
  | OpenAIEndpointId
  | PerplexityEndpointId
  | XAIEndpointId
  | AmazonEndpointId
  | CohereEndpointId
  | DeepSeekEndpointId
  | GoogleEndpointId
  | GroqEndpointId
  | MetaLlamaEndpointId
  | MistralEndpointId
  | MoonshotEndpointId
  | NvidiaEndpointId;

// ============= Base Types =============

/**
 * Author metadata type
 */
export interface AuthorMetadata {
  modelCount: number;
  supported: boolean;
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  apiUrl?: string;
}

export const AUTHORS = [
  "anthropic",
  "openai",
  "google",
  "meta-llama",
  "mistralai",
  "amazon",
  "microsoft",
  "nvidia",
  "cohere",
  "deepseek",
  "qwen",
  "x-ai",
  "moonshotai",
  "perplexity",
] as const;

export type AuthorName = (typeof AUTHORS)[number];

export const PROVIDERS = [
  "anthropic",
  "openai",
  "perplexity",
  "vertex",
  "bedrock",
  "azure-openai",
  "xai",
  "groq",
  "deepseek",
  "cohere",
] as const;

export type ProviderName = (typeof PROVIDERS)[number];

export type Modality =
  | "text"
  | "text->text"
  | "text+image->text"
  | "text->image"
  | "multimodal";

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
  | "json_mode"
  | "truncate";

// ============= Endpoint Types =============

export type EndpointKey<TModelName extends string> = `${TModelName}:${string}`;

// ============= Model Definition =============

export interface Model {
  name: string;
  author: AuthorName;
  description: string;
  contextLength: number;
  maxOutputTokens: number;
  created: string;
  modality: Modality;
  tokenizer: Tokenizer;
}

// ============= Pricing =============

export interface ModelPricing {
  prompt: number;
  completion: number;
  image?: number;
  cacheRead?: number;
  cacheWrite?:
    | number
    | {
        "5m": number;
        "1h": number;
        default: number;
      };
  thinking?: number;
}

// ============= Endpoint Definition (The Core Type) =============

export interface Endpoint {
  // Identity
  modelId: ModelName; // e.g., "claude-3.5-sonnet"
  provider: ProviderName; // e.g., "bedrock"
  region?: string; // e.g., "us-west-2"

  // Configuration
  providerModelId: string; // e.g., "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
  pricing: ModelPricing;
  contextLength: number;
  maxCompletionTokens: number;
  supportedParameters: StandardParameter[];

  // Availability
  ptbEnabled: boolean; // Can Helicone use this for pass-through billing?
}

// ============= Provider Configuration =============

export interface UserConfig {
  region?: string;
  projectId?: string;
  deploymentName?: string;
  resourceName?: string;
  crossRegion?: boolean;
}

export interface ProviderConfig {
  id: ProviderName;
  baseUrl: string;
  auth: "api-key" | "oauth" | "aws-signature" | "azure-ad";
  buildUrl: (endpoint: Endpoint, config: UserConfig) => string;
  buildModelId?: (endpoint: Endpoint, config: UserConfig) => string;
  requiredConfig?: Array<keyof UserConfig>;
  pricingPages?: string[];
  modelPages?: string[];
}

// ============= Index Types (Build-time generated) =============

export interface ModelIndexes {
  // Model → All endpoints
  byModel: Map<ModelName, Endpoint[]>;
  // Model → PTB-enabled endpoints
  byModelPtb: Map<ModelName, Endpoint[]>;
  // Model + Provider → Endpoints
  byModelProvider: Map<`${ModelName}:${ProviderName}`, Endpoint[]>;
  // Direct endpoint lookup by ID
  byId: Map<string, Endpoint>; // Endpoint IDs are dynamic strings
  // Provider → All models it serves
  providerToModels: Map<ProviderName, ModelName[]>;
}
