import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "claude-3.7-sonnet:anthropic": {
    modelId: "claude-3.7-sonnet",
    provider: "anthropic",
    baseModelId: "claude-3-7-sonnet-20250219",
    version: "20250219",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    ptbEnabled: true,
  },

  "claude-3.7-sonnet:vertex": {
    modelId: "claude-3.7-sonnet",
    provider: "vertex",
    baseModelId: "claude-3-7-sonnet@20250219",
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
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    ptbEnabled: true,
    endpoints: {
      global: {
        providerModelId: "claude-3-7-sonnet@20250219",
      },
    },
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
