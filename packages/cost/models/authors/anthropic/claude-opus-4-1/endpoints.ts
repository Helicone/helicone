import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    modelId: "claude-opus-4-1",
    provider: "anthropic",
    baseModelId: "claude-opus-4-1-20250805",
    version: "20250805",
    pricing: {
      prompt: 15,
      completion: 75,
      cacheRead: 1.5,
      cacheWrite: {
        "5m": 18.75,
        "1h": 30,
        default: 18.75,
      },
    },
    contextLength: 200000,
    maxCompletionTokens: 32000,
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

  "claude-opus-4-1:vertex": {
    modelId: "claude-opus-4-1",
    provider: "vertex",
    baseModelId: "claude-opus-4-1@20250805",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 15,
      completion: 75,
      cacheRead: 1.5,
      cacheWrite: 18.75,
    },
    contextLength: 200000,
    maxCompletionTokens: 32000,
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
        providerModelId: "claude-opus-4-1@20250805",
      },
    },
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
