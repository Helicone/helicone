import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus4ModelName } from "./model";

export const endpoints = {
  "claude-opus-4:anthropic": {
    providerModelId: "claude-opus-4-20250514",
    provider: "anthropic",
    author: "anthropic",
    version: "20250514",
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          read: 0.1,
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
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },

  "claude-opus-4:vertex": {
    providerModelId: "claude-opus-4@20250514",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          read: 0.1,
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
        providerModelId: "claude-opus-4@20250514",
      },
    },
  },
  "claude-opus-4:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-opus-4-20250514-v1:0",
    version: "20250514",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        cacheMultipliers: {
          read: 0.1,
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
    ptbEnabled: true,
    endpointConfigs: {
      "us-east-1": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeOpus4ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
