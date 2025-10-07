import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { BedrockProvider } from "./bedrock";
import { VertexProvider } from "./vertex";
import { AzureOpenAIProvider } from "./azure";
import { PerplexityProvider } from "./perplexity";
import { GroqProvider } from "./groq";
import { DeepSeekProvider } from "./deepseek";
import { CohereProvider } from "./cohere";
import { XAIProvider } from "./xai";
import { GoogleProvider } from "./google";
import { DeepInfraProvider } from "./deepinfra";
import { OpenRouterProvider } from "./openrouter";
import { NovitaProvider } from "./novita";
import { HeliconeProvider } from "./helicone";

// Create singleton instances (stateless, so safe to share)
export const providers = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  bedrock: new BedrockProvider(),
  vertex: new VertexProvider(),
  azure: new AzureOpenAIProvider(),
  perplexity: new PerplexityProvider(),
  groq: new GroqProvider(),
  deepseek: new DeepSeekProvider(),
  cohere: new CohereProvider(),
  xai: new XAIProvider(),
  deepinfra: new DeepInfraProvider(),
  "google-ai-studio": new GoogleProvider(),
  openrouter: new OpenRouterProvider(),
  novita: new NovitaProvider(),
  helicone: new HeliconeProvider(),
} as const;

export type ModelProviderName = keyof typeof providers;

// Re-export base for extending
export { BaseProvider } from "./base";
