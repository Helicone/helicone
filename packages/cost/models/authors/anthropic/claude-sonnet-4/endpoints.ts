import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "claude-sonnet-4:anthropic": {
    modelId: "claude-sonnet-4",
    provider: "anthropic",
    baseModelId: "claude-sonnet-4-20250514",
    version: "20250514",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "stop",
      "reasoning",
      "include_reasoning",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
  },

  "claude-sonnet-4:vertex": {
    modelId: "claude-sonnet-4",
    provider: "vertex",
    baseModelId: "claude-sonnet-4@20250514",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "stop",
      "reasoning",
      "include_reasoning",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpoints: {
      global: {
        providerModelId: "claude-sonnet-4@20250514",
      },
    },
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
