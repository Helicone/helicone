import type { Endpoint } from "../../../types";

export const endpoints = {
  "claude-opus-4:anthropic": {
    modelId: "claude-opus-4",
    provider: "anthropic",
    baseModelId: "claude-opus-4-20250514",
    version: "20250514",
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
  },

  "claude-opus-4:vertex": {
    modelId: "claude-opus-4",
    provider: "vertex",
    baseModelId: "claude-opus-4@20250514",
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
    deployments: {
      "global": {
        providerModelId: "claude-opus-4@20250514",
      },
    },
  },
} satisfies Record<string, Endpoint>;

export type EndpointId = keyof typeof endpoints;