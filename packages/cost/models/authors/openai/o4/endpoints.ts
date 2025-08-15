import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "o4-mini:openai": {
    modelId: "o4-mini",
    provider: "openai",
    baseModelId: "o4-mini",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.275,
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
  "o4-mini-high:openai": {
    modelId: "o4-mini-high",
    provider: "openai",
    baseModelId: "o4-mini-high-2025-04-16",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.275,
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
