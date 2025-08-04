/**
 * Model system constants
 * Extracted from types.ts for better organization
 */

// Using const assertion for immutable creator list
export const MODEL_CREATORS = [
  "OpenAI",
  "Anthropic", 
  "Google",
  "Meta",
  "DeepSeek",
  "Mistral",
  "Cohere",
  "xAI",
  "Nvidia",
  "Alibaba",
  "01.AI",
  "Qwen",
  "Moonshot",
] as const;

export type ModelCreator = typeof MODEL_CREATORS[number];

// Provider names - where models can be accessed
export const PROVIDER_NAMES = [
  "openai",
  "azure", 
  "anthropic",
  "bedrock",
  "google-ai",
  "google-vertex-ai",
  "openrouter",
  "deepseek",
  "together",
  "groq",
  "perplexity",
  "mistral",
  "cohere",
  "xAI",
  "meta",
  "nvidia",
  "nebius",
  "novita",
  "vercel",
  "fireworks",
  "qstash",
  "avian",
] as const;

export type ProviderName = typeof PROVIDER_NAMES[number];