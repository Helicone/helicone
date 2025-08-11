import type { Endpoint } from "../../../types";

export const endpoints = {
  "claude-3.5-haiku:anthropic": {
    modelId: "claude-3.5-haiku",
    provider: "anthropic",
    providerModelId: "claude-3-5-haiku-20241022",
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

  "claude-3.5-haiku:vertex:global": {
    modelId: "claude-3.5-haiku",
    provider: "vertex",
    region: "global",
    providerModelId: "claude-3-5-haiku@20241022",
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
  },

  // "claude-3.5-haiku:bedrock:us-west-2": {
  //   modelId: "claude-3.5-haiku",
  //   provider: "bedrock",
  //   region: "us-west-2",
  //   providerModelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
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
  // },
} satisfies Record<string, Endpoint>;

export type EndpointId = keyof typeof endpoints;