import type { Endpoint } from "../../../types";

export const endpoints = {
  "claude-3.5-sonnet-v2:anthropic": {
    modelId: "claude-3.5-sonnet-v2",
    provider: "anthropic",
    providerModelId: "claude-3-5-sonnet-20241022",
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

  "claude-3.5-sonnet-v2:vertex:global": {
    modelId: "claude-3.5-sonnet-v2",
    provider: "vertex",
    region: "global",
    providerModelId: "claude-3-5-sonnet-v2@20241022",
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
  },

  // "claude-3.5-sonnet-v2:bedrock:us-west-2": {
  //   modelId: "claude-3.5-sonnet-v2",
  //   provider: "bedrock",
  //   region: "us-west-2",
  //   providerModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
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
  // },

  // "claude-3.5-sonnet-v2:bedrock:eu-west-1": {
  //   modelId: "claude-3.5-sonnet-v2",
  //   provider: "bedrock",
  //   region: "eu-west-1",
  //   providerModelId: "eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //   pricing: {
  //     prompt: 3.3,
  //     completion: 16.5,
  //     cacheRead: 0.33,
  //     cacheWrite: {
  //       "5m": 4.13,
  //       "1h": 6.6,
  //       default: 4.13,
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
  //   ptbEnabled: false,
  // },

  // "claude-3.5-sonnet-v2:vertex:us-central1": {
  //   modelId: "claude-3.5-sonnet-v2",
  //   provider: "vertex",
  //   region: "us-central1",
  //   providerModelId: "claude-3-5-sonnet-v2@20241022",
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
  //   ptbEnabled: false,
  // },
} satisfies Record<string, Endpoint>;

export type EndpointId = keyof typeof endpoints;
