import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude37SonnetModelName } from "./model";

export const endpoints = {
  "claude-3.7-sonnet:anthropic": {
    provider: "anthropic",
    author: "anthropic",
    providerModelId: "claude-3-7-sonnet-20250219",
    version: "20250219",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
          write1h: 2.0,
        },
      },
    ],
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },

  "claude-3.7-sonnet:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-3-7-sonnet@20250219",
    version: "vertex-2023-10-16",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      global: {},
    },
  },
  "claude-3.7-sonnet:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-3-7-sonnet-20250219-v1:0",
    version: "20250219",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "us-east-1": {},
    },
  },
  "claude-3.7-sonnet:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-3.7-sonnet",
    pricing: [
      {
        threshold: 0,
        input: 0.000003165, // $3.17/1M - worst-case: $3.00/1M (Google) * 1.055
        output: 0.00001583, // $15.83/1M - worst-case: $15.00/1M (Google) * 1.055
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Claude37SonnetModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
