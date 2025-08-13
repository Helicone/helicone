import type { Endpoint } from "../../../types";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    modelId: "claude-opus-4-1",
    provider: "anthropic",
    providerModelId: "claude-opus-4-1-20250805",
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

  "claude-opus-4-1:vertex:global": {
    modelId: "claude-opus-4-1",
    provider: "vertex",
    region: "global",
    providerModelId: "claude-opus-4-1@20250805",
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
  },

  // "claude-opus-4-1:bedrock:us-west-2": {
  //   modelId: "claude-opus-4-1",
  //   provider: "bedrock",
  //   region: "us-west-2",
  //   providerModelId: "us.anthropic.claude-opus-4-1-20250805-v1:0",
  //   pricing: {
  //     prompt: 15,
  //     completion: 75,
  //     cacheRead: 1.5,
  //     cacheWrite: {
  //       "5m": 18.75,
  //       "1h": 30,
  //       default: 18.75,
  //     },
  //   },
  //   contextLength: 200000,
  //   maxCompletionTokens: 32000,
  //   supportedParameters: [
  //     "tools",
  //     "tool_choice",
  //     "reasoning",
  //     "include_reasoning",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: true,
  // },

  // "claude-opus-4-1:bedrock:ap-southeast-1": {
  //   modelId: "claude-opus-4-1",
  //   provider: "bedrock",
  //   region: "ap-southeast-1",
  //   providerModelId: "ap.anthropic.claude-opus-4-1-20250805-v1:0",
  //   pricing: {
  //     prompt: 16.5,
  //     completion: 82.5,
  //     cacheRead: 1.65,
  //     cacheWrite: {
  //       "5m": 20.6,
  //       "1h": 33,
  //       default: 20.6,
  //     },
  //   },
  //   contextLength: 200000,
  //   maxCompletionTokens: 32000,
  //   supportedParameters: [
  //     "tools",
  //     "tool_choice",
  //     "reasoning",
  //     "include_reasoning",
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