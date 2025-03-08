import { Message } from "packages/llm-mapper/types";
import findBestMatch from "string-similarity-js";

// Define the type for the entire PROVIDER_MODELS object
export type ProviderKeys =
  | "ANTHROPIC"
  | "OPENAI"
  | "GOOGLE"
  | "META_LLAMA"
  | "DEEPSEEK"
  | "MISTRALAI"
  | "QWEN"
  | "X"
  | "PERPLEXITY"
  | "COHERE"
  | "AMAZON"
  | "MICROSOFT"
  | string; // Keep string for backward compatibility with any other providers

export type ProviderModels = {
  [key in ProviderKeys]: ProviderInfo;
};
export type SupportedProviders = keyof ProviderModels;
export interface ProviderInfo {
  name: string;
  openrouterDirectory: string;
  models: ModelInfo[];
}
export interface ModelInfo {
  name: string;
  openrouterName?: string;
  supportsReasoningEffort: boolean;
  max_tokens?: number;
}

// Providers-models used by the generate function
export const PROVIDER_MODELS: ProviderModels = {
  // General Use Cases
  ANTHROPIC: {
    name: "Anthropic",
    openrouterDirectory: "anthropic",
    models: [
      {
        name: "claude-3-7-sonnet-latest",
        openrouterName: "claude-3.7-sonnet",
        supportsReasoningEffort: false,
        max_tokens: 8192,
      },
      {
        name: "claude-3-5-haiku-latest",
        openrouterName: "claude-3.5-haiku",
        supportsReasoningEffort: false,
        max_tokens: 8192,
      },
      {
        name: "claude-3-5-sonnet-latest",
        openrouterName: "claude-3.5-sonnet",
        supportsReasoningEffort: false,
        max_tokens: 8192,
      },
      {
        name: "claude-3-opus-latest",
        openrouterName: "claude-3-opus",
        supportsReasoningEffort: false,
        max_tokens: 4096,
      },
    ],
  },
  OPENAI: {
    name: "OpenAI",
    openrouterDirectory: "openai",
    models: [
      "gpt-4o-mini",
      "gpt-4o",
      "chatgpt-4o-latest",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o3-mini",
      "o1",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: ["o1", "o3-mini"].some((str) =>
        model.includes(str)
      ),
    })),
  },
  GOOGLE: {
    name: "Google",
    openrouterDirectory: "google",
    models: [
      "gemini-2.0-flash-lite-001",
      "gemini-2.0-flash-001",
      "gemini-flash-1.5",
      "gemini-flash-1.5-8b",
      "gemini-pro-1.5",
      "gemma-2-27b-it",
      "gemma-2-9b-it",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  META_LLAMA: {
    name: "Meta Llama",
    openrouterDirectory: "meta-llama",
    models: [
      "llama-3.1-70b-instruct",
      "llama-3.1-8b-instruct",
      "llama-3.1-405b-instruct",
      "llama-3.2-1b-instruct",
      "llama-3.2-3b-instruct",
      "llama-3.2-11b-vision-instruct",
      "llama-3.2-90b-vision-instruct",
      "llama-3-70b-instruct",
      "llama-3-8b-instruct",
      "llama-3-70b-instruct:nitro",
      "llama-3-8b-instruct:nitro",
      "llama-3-8b-instruct:extended",
      "llama-guard-2-8b",
      "llama-3.1-405b",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  DEEPSEEK: {
    name: "DeepSeek",
    openrouterDirectory: "deepseek",
    models: ["deepseek-r1", "deepseek-chat"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  MISTRALAI: {
    name: "Mistral AI",
    openrouterDirectory: "mistral",
    models: [
      "mistral-nemo",
      "codestral-2501",
      "mixtral-8x7b-instruct",
      "ministral-8b",
      "ministral-3b",
      "mistral-7b-instruct",
      "mistral-large",
      "mistral-small",
      "codestral-mamba",
      "pixtral-12b",
      "pixtral-large-2411",
      "mistral-7b-instruct-v0.1",
      "mistral-7b-instruct-v0.3",
      "mistral-medium",
      "mistral-large-2411",
      "mistral-large-2407",
      "mixtral-8x7b-instruct:nitro",
      "mixtral-8x22b-instruct",
      "mistral-tiny",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  QWEN: {
    name: "Qwen",
    openrouterDirectory: "qwen",
    models: [
      "qwen-2.5-72b-instruct",
      "qwen-2.5-7b-instruct",
      "qwen-2.5-coder-32b-instruct",
      "eva-qwen-2.5-72b",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  X: {
    name: "X AI",
    openrouterDirectory: "x-ai",
    models: ["grok-2-1212", "grok-beta", "grok-2-vision-1212"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  PERPLEXITY: {
    name: "Perplexity",
    openrouterDirectory: "perplexity",
    models: [
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-large-128k-chat",
      "llama-3.1-sonar-huge-128k-online",
      "llama-3.1-sonar-small-128k-online",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  COHERE: {
    name: "Cohere",
    openrouterDirectory: "cohere",
    models: ["command-r-plus", "command-r"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  AMAZON: {
    name: "Amazon",
    openrouterDirectory: "amazon",
    models: ["nova-lite-v1", "nova-micro-v1", "nova-pro-v1"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  MICROSOFT: {
    name: "Microsoft",
    openrouterDirectory: "microsoft",
    models: ["wizardlm-2-8x22b", "wizardlm-2-7b", "phi-4"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  NVIDIA: {
    name: "NVIDIA",
    openrouterDirectory: "nvidia",
    models: ["llama-3.1-nemotron-70b-instruct"].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  // Finetunes and Roleplay Use Cases
  NOUSRESEARCH: {
    name: "Nous Research",
    openrouterDirectory: "nousresearch",
    models: [
      "hermes-3-llama-3.1-405b",
      "hermes-3-llama-3.1-70b",
      "hermes-2-pro-llama-3-8b",
      "nous-hermes-llama2-13b",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
  SAO10K: {
    name: "SAO10K",
    openrouterDirectory: "sao10k",
    models: [
      "l3-euryale-70b",
      "l3.1-euryale-70b",
      "l3-lunaris-8b",
      "l3.1-70b-hanami-x1",
    ].map((model) => ({
      name: model,
      supportsReasoningEffort: false,
    })),
  },
} as const;

export function findClosestProvider(
  provider: string
): keyof typeof PROVIDER_MODELS {
  const providers = Object.keys(PROVIDER_MODELS);

  // Check for exact match first (uppercase)
  const normalizedProvider = provider.trim().toUpperCase();
  const exactMatch = providers.find((p) => p === normalizedProvider);
  if (exactMatch) {
    return exactMatch as keyof typeof PROVIDER_MODELS;
  }

  // If not found: find and return the closest match
  const similarities = providers.map((p) => ({
    target: p,
    similarity: findBestMatch(provider, p),
  }));
  const closestMatch = similarities.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
  return closestMatch.target as keyof typeof PROVIDER_MODELS;
}

export function findClosestModel(
  provider: keyof typeof PROVIDER_MODELS,
  model: string
): string {
  const models = PROVIDER_MODELS[provider].models.map((m) => m.name);

  // Check for exact match first (lowercase)
  const normalizedModel = model.trim().toLowerCase();
  const exactMatch = models.find((m) => m.toLowerCase() === normalizedModel);
  if (exactMatch) {
    return exactMatch;
  }

  // If no found: find and return the closest match
  const similarities = models.map((m) => ({
    target: m,
    similarity: findBestMatch(model, m),
  }));
  const closestMatch = similarities.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
  return closestMatch.target;
}

// Helper functions for creating message objects
export function $system(content: string): Message {
  return { _type: "message", role: "system", content };
}
export function $user(content: string): Message {
  return { _type: "message", role: "user", content };
}
export function $assistant(content: string): Message {
  return { _type: "message", role: "assistant", content };
}
