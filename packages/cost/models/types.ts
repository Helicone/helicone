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
  "zai",
  "baidu",
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
  | "Tekken"
  | "Zai"
  | "Baidu";

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
  | "verbosity"
  | "n";

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
  n: "Number of Completions",
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
  unsupportedParameters?: StandardParameter[];
}

export interface RateLimits {
  rpm?: number;
  tpm?: number;
  tpd?: number;
}

// Plugin types
export type PluginId = "web"; // Add more with | as we support more plugins

interface BasePlugin<T extends PluginId = PluginId> {
  id: T;
}

export interface WebSearchPlugin extends BasePlugin<"web"> {
  max_uses?: number;
  allowed_domains?: string[];
  blocked_domains?: string[];
  user_location?: {
    type?: "approximate";
    city?: string;
    region?: string; // state/region
    country?: string; // country code
    timezone?: string; // IANA timezone ID
  };
}

export type Plugin = WebSearchPlugin; // Add more with | as we add plugin types

export type BodyMappingType = "OPENAI" | "NO_MAPPING" | "RESPONSES";

export interface ModelProviderConfig extends BaseConfig {
  providerModelId: string;
  provider: ModelProviderName;
  author: AuthorName;
  supportedParameters: StandardParameter[];
  supportedPlugins?: PluginId[];
  rateLimits?: RateLimits;
  endpointConfigs: Record<string, EndpointConfig>;
  crossRegion?: boolean;
  priority?: number;
  quantization?: "fp4" | "fp8" | "fp16" | "bf16";
  responseFormat?: ResponseFormat;
  requireExplicitRouting?: boolean;
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
  bodyMapping?: BodyMappingType;
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
  gatewayMapping?: BodyMappingType;
  modelName?: string;
}

export interface ModelSpec {
  modelName: string;
  provider?: ModelProviderName;
  customUid?: string;
  isOnline?: boolean;
}

export interface AuthContext {
  apiKey?: string;
  secretKey?: string;
  orgId?: string;
  bodyMapping?: BodyMappingType;
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: string;
}

export interface AuthResult {
  headers: Record<string, string>;
}

export interface RequestBodyContext {
  parsedBody: any;
  bodyMapping: BodyMappingType;
  toAnthropic: (body: any, providerModelId?: string) => any;
}
