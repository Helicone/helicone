import { AnthropicProvider } from "./anthropic";
import { AzureOpenAIProvider } from "./azure";
import { BasetenProvider } from "./baseten";
import { BedrockProvider } from "./bedrock";
import { CerebrasProvider } from "./cerebras";
import { ChutesProvider } from "./chutes";
import { DeepInfraProvider } from "./deepinfra";
import { DeepSeekProvider } from "./deepseek";
import { FireworksProvider } from "./fireworks";
import { GoogleProvider } from "./google";
import { GroqProvider } from "./groq";
import { HeliconeProvider } from "./helicone";
import { MistralProvider } from "./mistral";
import { NebiusProvider } from "./nebius";
import { NovitaProvider } from "./novita";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";
import { PerplexityProvider } from "./perplexity";
import { VertexProvider } from "./vertex";
import { XAIProvider } from "./xai";

// Create singleton instances (stateless, so safe to share)
export const providers = {
  baseten: new BasetenProvider(),
  anthropic: new AnthropicProvider(),
  azure: new AzureOpenAIProvider(),
  bedrock: new BedrockProvider(),
  cerebras: new CerebrasProvider(),
  chutes: new ChutesProvider(),
  deepinfra: new DeepInfraProvider(),
  deepseek: new DeepSeekProvider(),
  fireworks: new FireworksProvider(),
  "google-ai-studio": new GoogleProvider(),
  groq: new GroqProvider(),
  helicone: new HeliconeProvider(),
  mistral: new MistralProvider(),
  nebius: new NebiusProvider(),
  novita: new NovitaProvider(),
  openai: new OpenAIProvider(),
  openrouter: new OpenRouterProvider(),
  perplexity: new PerplexityProvider(),
  vertex: new VertexProvider(),
  xai: new XAIProvider()
} as const;

export type ModelProviderName = keyof typeof providers;

// TODO: temporarily whitelist responses API providers until all mappings are done
export const ResponsesAPIEnabledProviders: ModelProviderName[] = [
  "openai",
  "helicone",
  "anthropic",
  "bedrock",

  // chat completions only
  "azure",
  "chutes",
  "deepinfra",
  "deepseek",

  // has known issues with returning structured JSONS
  // should be okay to enable, but its not stable enough to add without request
  // "google-ai-studio",
  "cerebras",
  "groq",
  "mistral",
  "nebius",
  "novita",
  "openrouter",
  "perplexity",
  "xai",
  "baseten",
  "fireworks",

  // anthropic and chat completions provider
  "vertex"

  // anthropic only
  // none right now, need anthropic mapper
];

// Re-export base for extending
export { BaseProvider } from "./base";
