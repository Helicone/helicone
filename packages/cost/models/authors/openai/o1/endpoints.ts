import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "o1:openai": {
    modelId: "o1",
    provider: "openai",
    baseModelId: "o1",
    pricing: {
      prompt: 15,
      completion: 60,
      image: 0.021675,
      cacheRead: 7.5,
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
  "o1-pro:openai": {
    modelId: "o1-pro",
    provider: "openai",
    baseModelId: "o1-pro",
    pricing: {
      prompt: 15,
      completion: 60,
      cacheRead: 7.5,
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
  "o1-mini:openai": {
    modelId: "o1-mini",
    provider: "openai",
    baseModelId: "o1-mini",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
    },
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: ["seed", "max_tokens"],
    ptbEnabled: true,
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
