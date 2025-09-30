import { ModelProviderName } from "./providers";

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
  "xai",
  "moonshotai",
  "perplexity",
  "alibaba",
] as const;

export type AuthorName = (typeof AUTHORS)[number] | "passthrough";

export type InputModality = "text" | "image" | "audio" | "video";
export type OutputModality = "text" | "image" | "audio" | "video";

export interface Modality {
  inputs: InputModality[];
  outputs: OutputModality[];
}

export type ResponseFormat = "ANTHROPIC" | "OPENAI";

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
  | "Grok"
  | "Tekken";

export type StandardParameter =
  | "max_tokens"
  | "max_completion_tokens"
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
  | "structured_outputs"
  | "verbosity";

export const PARAMETER_LABELS: Record<StandardParameter, string> = {
  max_tokens: "Max Tokens",
  max_completion_tokens: "Max Completion Tokens",
  temperature: "Temperature",
  top_p: "Top-P",
  top_k: "Top-K",
  stop: "Stop Sequences",
  stream: "Streaming",
  frequency_penalty: "Frequency Penalty",
  presence_penalty: "Presence Penalty",
  repetition_penalty: "Repetition Penalty",
  seed: "Seed",
  tools: "Function Calling",
  tool_choice: "Tool Choice",
  functions: "Functions",
  function_call: "Function Call",
  reasoning: "Reasoning",
  include_reasoning: "Include Reasoning",
  thinking: "Chain of Thought",
  response_format: "Response Format",
  json_mode: "JSON Mode",
  truncate: "Truncate",
  min_p: "Min-P",
  logit_bias: "Logit Bias",
  logprobs: "Log Probabilities",
  top_logprobs: "Top Log Probs",
  structured_outputs: "Structured Outputs",
  verbosity: "Verbosity",
};

export interface ModelPricing {
  threshold: number;
  input: number;
  output: number;
  image?: number;
  cacheMultipliers?: {
    cachedInput: number;
    write5m?: number;
    write1h?: number;
  };
  cacheStoragePerHour?: number;
  thinking?: number;
  request?: number;
  audio?: number;
  video?: number;
  web_search?: number;
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
  pricing: ModelPricing[];
  contextLength: number;
  maxCompletionTokens: number;
  ptbEnabled: boolean;
  version?: string;
}

export interface RateLimits {
  rpm?: number;
  tpm?: number;
  tpd?: number;
}

export interface ModelProviderConfig extends BaseConfig {
  providerModelId: string;
  provider: ModelProviderName;
  author: AuthorName;
  supportedParameters: StandardParameter[];
  rateLimits?: RateLimits;
  endpointConfigs: Record<string, EndpointConfig>;
  crossRegion?: boolean;
  priority?: number;
<<<<<<< HEAD
=======
  quantization?: "fp4" | "fp8";
>>>>>>> origin/main
  responseFormat?: ResponseFormat;
}

export interface EndpointConfig extends UserEndpointConfig {
  providerModelId?: string;
  pricing?: ModelPricing[];
  contextLength?: number;
  maxCompletionTokens?: number;
  ptbEnabled?: boolean;
  version?: string;
  rateLimits?: RateLimits;
  priority?: number;
}

export interface RequestParams {
  isStreaming?: boolean;
}

export interface Endpoint extends BaseConfig {
  modelConfig: ModelProviderConfig;
  userConfig: UserEndpointConfig;
  provider: ModelProviderName;
  author: AuthorName;
  providerModelId: string;
  supportedParameters: StandardParameter[];
  priority?: number; // Lower number = higher priority
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
  modelName?: string;
}

export interface AuthContext {
  apiKey?: string;
  secretKey?: string;
  orgId?: string;
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
  toAnthropic: (body: any, providerModelId?: string) => any;
}
