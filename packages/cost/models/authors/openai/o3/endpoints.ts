import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "o3:openai": {
    modelId: "o3",
    provider: "openai",
    baseModelId: "o3-2025-04-16",
    pricing: {
      prompt: 2,
      completion: 8,
      cacheRead: 0.5,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
  },
  "o3-pro:openai": {
    modelId: "o3-pro",
    provider: "openai",
    baseModelId: "o3-pro-2025-06-10",
    pricing: {
      prompt: 20,
      completion: 80,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
  },
  "o3-mini:openai": {
    modelId: "o3-mini",
    provider: "openai",
    baseModelId: "o3-mini",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
  },
  "o3-mini-high:openai": {
    modelId: "o3-mini-high",
    provider: "openai",
    baseModelId: "o3-mini-high",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
