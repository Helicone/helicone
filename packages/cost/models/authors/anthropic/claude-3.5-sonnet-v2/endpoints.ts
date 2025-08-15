import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "claude-3.5-sonnet-v2:anthropic": {
    modelId: "claude-3.5-sonnet-v2",
    provider: "anthropic",
    baseModelId: "claude-3-5-sonnet-20241022",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: {
        "5m": 3.75,
        "1h": 6,
        default: 3.75,
      },
    },
    contextLength: 200000,
    maxCompletionTokens: 8192,
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

  // "claude-3.5-sonnet-v2:bedrock": {
  //   modelId: "claude-3.5-sonnet-v2",
  //   provider: "bedrock",
  //   baseModelId: "{region}.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //   pricing: {
  //     prompt: 3,
  //     completion: 15,
  //     cacheRead: 0.3,
  //     cacheWrite: {
  //       "5m": 3.75,
  //       "1h": 6,
  //       default: 3.75,
  //     },
  //   },
  //   contextLength: 200000,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "tools",
  //     "tool_choice",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: true,
  //   endpoints: {
  //     "us-west-2": {
  //       providerModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //     },
  //     "eu-west-1": {
  //       providerModelId: "eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //     },
  //   },
  // },

  "claude-3.5-sonnet-v2:vertex": {
    modelId: "claude-3.5-sonnet-v2",
    provider: "vertex",
    baseModelId: "claude-3-5-sonnet-v2@20241022",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    },
    contextLength: 200000,
    maxCompletionTokens: 8192,
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
        providerModelId: "claude-3-5-sonnet-v2@20241022",
      },
    },
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
