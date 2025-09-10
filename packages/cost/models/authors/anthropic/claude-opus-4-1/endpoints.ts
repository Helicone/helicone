import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus41ModelName } from "./model";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    providerModelId: "claude-opus-4-1-20250805",
    provider: "anthropic",
    author: "anthropic",
    version: "20250805",
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
          write1h: 2.0,
        },
      },
    ],
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },

  "claude-opus-4-1:vertex": {
    providerModelId: "claude-opus-4-1@20250805",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
    ptbEnabled: false,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
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
    endpointConfigs: {
      global: {
        providerModelId: "claude-opus-4-1@20250805",
      },
    },
  },
  "claude-opus-4-1:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-opus-4-1-20250805-v1:0",
    version: "20250805",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
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
      "top_p",
      "top_k",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "us-east-1": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeOpus41ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
