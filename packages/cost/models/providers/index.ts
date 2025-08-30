import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { BedrockProvider } from "./bedrock";
import { VertexProvider } from "./vertex";
import { AzureOpenAIProvider } from "./azure-openai";
import { PerplexityProvider } from "./perplexity";
import { GroqProvider } from "./groq";
import { DeepSeekProvider } from "./deepseek";
import { CohereProvider } from "./cohere";
import { XAIProvider } from "./xai";
import { GoogleProvider } from "./google";

// Create singleton instances (stateless, so safe to share)
export const providers = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  bedrock: new BedrockProvider(),
  vertex: new VertexProvider(),
  "azure-openai": new AzureOpenAIProvider(),
  perplexity: new PerplexityProvider(),
  groq: new GroqProvider(),
  deepseek: new DeepSeekProvider(),
  cohere: new CohereProvider(),
  xai: new XAIProvider(),
  "google-ai-studio": new GoogleProvider(),
} as const;

export type ModelProviderName = keyof typeof providers;

// Re-export base for extending
export { BaseProvider } from "./base";
