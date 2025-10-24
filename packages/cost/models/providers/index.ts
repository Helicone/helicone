import { AnthropicProvider } from "./anthropic";
import { AzureOpenAIProvider } from "./azure";
import { BedrockProvider } from "./bedrock";
import { ChutesProvider } from "./chutes";
import { CohereProvider } from "./cohere";
import { DeepInfraProvider } from "./deepinfra";
import { DeepSeekProvider } from "./deepseek";
import { GoogleProvider } from "./google";
import { GroqProvider } from "./groq";
import { HeliconeProvider } from "./helicone";
import { NebiusProvider } from "./nebius";
import { NovitaProvider } from "./novita";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";
import { PerplexityProvider } from "./perplexity";
import { VertexProvider } from "./vertex";
import { XAIProvider } from "./xai";

// Create singleton instances (stateless, so safe to share)
export const providers = {
  anthropic: new AnthropicProvider(),
  azure: new AzureOpenAIProvider(),
  bedrock: new BedrockProvider(),
  chutes: new ChutesProvider(),
  cohere: new CohereProvider(),
  deepinfra: new DeepInfraProvider(),
  deepseek: new DeepSeekProvider(),
  "google-ai-studio": new GoogleProvider(),
  groq: new GroqProvider(),
  helicone: new HeliconeProvider(),
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

  // chat completions only
  "azure",
  "chutes",
  "cohere",
  "deepinfra",
  "deepseek",
  
  // has known issues with returning structured JSONS
  // should be okay to enable, but its not stable enough to add without request
  // "google-ai-studio",
  
  "groq",
  "nebius",
  "novita",
  "openrouter",
  "perplexity",
  "xai",

  // anthropic and chat completions provider
  "vertex"

  // anthropic only
  // none right now, need anthropic mapper
];

// Re-export base for extending
export { BaseProvider } from "./base";
