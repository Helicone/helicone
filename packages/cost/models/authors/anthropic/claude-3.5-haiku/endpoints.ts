import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "claude-3.5-haiku:anthropic": {
    modelId: "claude-3.5-haiku",
    provider: "anthropic",
    baseModelId: "claude-3-5-haiku-20241022",
    pricing: {
      prompt: 0.8,
      completion: 4,
      cacheRead: 0.08,
      cacheWrite: {
        "5m": 1,
        "1h": 1.6,
        default: 1,
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

  "claude-3.5-haiku:vertex": {
    modelId: "claude-3.5-haiku",
    provider: "vertex",
    baseModelId: "claude-3-5-haiku@20241022",
    pricing: {
      prompt: 0.8,
      completion: 4,
      cacheRead: 0.08,
      cacheWrite: 1,
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
    ptbEnabled: false,
    endpoints: {
      global: {
        providerModelId: "claude-3-5-haiku@20241022",
      },
    },
  },

  // Bedrock not currently supported
  // "claude-3.5-haiku:bedrock": {
  //   modelId: "claude-3.5-haiku",
  //   provider: "bedrock",
  //   baseModelId: "{region}.anthropic.claude-3-5-haiku-20241022-v1:0",
  //   pricing: {
  //     prompt: 0.8,
  //     completion: 4,
  //     cacheRead: 0.08,
  //     cacheWrite: {
  //       "5m": 1,
  //       "1h": 1.6,
  //       default: 1,
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
  //       providerModelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  //     },
  //   },
  // },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
