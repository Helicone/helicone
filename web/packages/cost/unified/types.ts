import { MapperName, PathMapper } from "../../llm-mapper/path-mapper";
import { LLMRequestBody } from "../../llm-mapper/types";

// Define the three main model creators we're focusing on
export type Creator = "OpenAI" | "Anthropic" | "Google" | "Meta" | "DeepSeek";

// Provider types
export type Provider =
  | "OPENAI"
  | "AZURE"
  | "ANTHROPIC"
  | "BEDROCK"
  | "GOOGLE_GEMINI"
  | "GOOGLE_VERTEXAI"
  | "OPENROUTER"
  | "DEEPSEEK";

// Provider configuration
export interface ProviderConfig {
  baseUrl: string;
  authHeaderConfig: {
    headerName: string;
    valuePrefix?: string;
  };
  defaultEndpoint: string;
  defaultMapper: MapperName;
  envVars: string[];
  defaultHeaders?: Record<string, string>;
}

// Token cost structure
export interface TokenCost {
  input: number;
  output: number;
  input_audio?: number;
  output_audio?: number;
  input_cache_write?: number;
  input_cache_read?: number;
}

// Parameters that can be applied at provider or model level
export interface Parameters {
  max_tokens?: number;
  reasoning_effort?: "low" | "medium" | "high";
  endpoint?: string;
  mapper?: PathMapper<unknown, LLMRequestBody>;
  [key: string]: any; // Allow for additional parameters
}

// Provider-specific model implementation
export interface ProviderModel {
  provider: Provider;
  modelString: string;
  tokenCost?: TokenCost;
  parameters?: Parameters;
}

// Model configuration with providers and defaults
export interface ModelConfig {
  defaultTokenCost?: TokenCost;
  defaultParameters?: Parameters;
  providers: ProviderModel[];
}

// Maps from a model name to its configuration
export interface ModelProviderMapping {
  [modelName: string]: ModelConfig;
}

// Maps from a creator to their models and configurations
export type CreatorModelMapping = Record<Creator, ModelProviderMapping>;
