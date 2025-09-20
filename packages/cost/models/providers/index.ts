import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { BedrockProvider } from "./bedrock";
import { VertexProvider } from "./vertex";
import { AzureOpenAIProvider } from "./azure";
import { GroqProvider } from "./groq";
import { DeepSeekProvider } from "./deepseek";
import { XAIProvider } from "./xai";
import { GoogleProvider } from "./google";
import { DeepInfraProvider } from "./deepinfra";
import { OpenRouterProvider } from "./openrouter";

// Create singleton instances (stateless, so safe to share)
export const providers = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAIProvider(),
  bedrock: new BedrockProvider(),
  vertex: new VertexProvider(),
  azure: new AzureOpenAIProvider(),
  groq: new GroqProvider(),
  deepseek: new DeepSeekProvider(),
  xai: new XAIProvider(),
  deepinfra: new DeepInfraProvider(),
  "google-ai-studio": new GoogleProvider(),
  openrouter: new OpenRouterProvider(),
} as const;

export type ModelProviderName = keyof typeof providers;

// Re-export base for extending
export { BaseProvider } from "./base";
