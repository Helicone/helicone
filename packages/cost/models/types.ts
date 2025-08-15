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
  | "truncate";

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
}

export interface EndpointConfig {
  providerModelId?: string;
  pricing?: ModelPricing;
  contextLength?: number;
  maxCompletionTokens?: number;
  ptbEnabled?: boolean;
  version?: string;
}

export interface Endpoint extends BaseConfig {
  provider: ProviderName;
  providerModelId: string;
  supportedParameters: StandardParameter[];
}

export interface UserEndpointConfig {
  region?: string;
  projectId?: string;
  deploymentName?: string;
  resourceName?: string;
  crossRegion?: boolean;
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
  model: string;
  provider: ProviderName;
  bodyMapping: "OPENAI" | "NO_MAPPING";
  toAnthropic: (body: any) => any;
}

export interface ProviderConfig {
  baseUrl: string;
  auth: "api-key" | "oauth" | "aws-signature" | "azure-ad";
  buildUrl: (
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig
  ) => string;
  buildModelId?: (
    endpoint: ModelProviderConfig,
    config: UserEndpointConfig
  ) => string;
  requiredConfig?: Array<keyof UserEndpointConfig>;
  authenticate?: (context: AuthContext) => Promise<AuthResult> | AuthResult;
  buildRequestBody?: (context: RequestBodyContext) => Promise<string> | string;
  pricingPages?: string[];
  modelPages?: string[];
}
