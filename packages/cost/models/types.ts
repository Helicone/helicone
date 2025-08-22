import { ProviderName } from "./providers";

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
  | "max_tokens"
  | "temperature"
  | "top_p"
  | "top_k"
  | "stop"
  | "stream"
  | "frequency_penalty"
  | "presence_penalty"
  | "repetition_penalty"
  | "seed"
  | "tools"
  | "tool_choice"
  | "functions"
  | "function_call"
  | "reasoning"
  | "include_reasoning"
  | "thinking"
  | "response_format"
  | "json_mode"
  | "truncate"
  | "min_p"
  | "logit_bias"
  | "logprobs"
  | "top_logprobs"
  | "structured_outputs";

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
  request?: number;
  audio?: number;
  video?: number;
  web_search?: number;
  internal_reasoning?: number;
}

export interface ModelConfig {
  name: string;
  author: AuthorName;
  description: string;
  contextLength: number;
  maxOutputTokens: number;
  created: string;
  modality: Modality;
  tokenizer: Tokenizer;
}

interface BaseConfig {
  pricing: ModelPricing;
  contextLength: number;
  maxCompletionTokens: number;
  ptbEnabled: boolean;
  version?: string;
}

export interface ModelProviderConfig extends BaseConfig {
  providerModelId: string;
  provider: ProviderName;
  supportedParameters: StandardParameter[];
  endpointConfigs: Record<string, EndpointConfig>;
  crossRegion?: boolean;
}

export interface EndpointConfig extends UserEndpointConfig {
  providerModelId?: string;
  pricing?: ModelPricing;
  contextLength?: number;
  maxCompletionTokens?: number;
  ptbEnabled?: boolean;
  version?: string;
}

export interface Endpoint extends BaseConfig {
  baseUrl: string;
  provider: ProviderName;
  providerModelId: string;
  supportedParameters: StandardParameter[];
}

export interface UserEndpointConfig {
  region?: string;
  location?: string;
  projectId?: string;
  baseUri?: string; // Azure OpenAI
  deploymentName?: string;
  resourceName?: string;
  apiVersion?: string; // Azure OpenAI
  crossRegion?: boolean;
  gatewayMapping?: "OPENAI" | "NO_MAPPING";
}

export interface AuthContext {
  endpoint: Endpoint;
  config: UserEndpointConfig;
  apiKey?: string;
  secretKey?: string;
  bodyMapping?: "OPENAI" | "NO_MAPPING";
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: string;
}

export interface AuthResult {
  headers: Record<string, string>;
}

export interface RequestBodyContext {
  parsedBody: any;
  bodyMapping: "OPENAI" | "NO_MAPPING";
  toAnthropic: (body: any) => any;
}
