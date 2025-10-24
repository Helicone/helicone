import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet45ModelName } from "./model";

export const endpoints = {
  "claude-4.5-sonnet:anthropic": {
    providerModelId: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    author: "anthropic",
    version: "20250929",
    priority: 3,
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
        // cacheMultipliers inherited from base tier
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-4.5-sonnet:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-sonnet-4-5@20250929",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    crossRegion: true,
    priority: 4,
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "stop",
      "reasoning",
      "include_reasoning",
      "tools",
      "tool_choice",
    ],
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      global: {
        providerModelId: "claude-sonnet-4-5@20250929",
      },
    },
  },
  "claude-4.5-sonnet:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",
    version: "20250929",
    crossRegion: true,
    priority: 4,
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "us-east-1": {},
    },
  },
  "claude-4.5-sonnet:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-sonnet-4.5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000633, // $6.33/1M - worst-case: $6.00/1M (Google >200K) * 1.055
        output: 0.00002374, // $23.74/1M - worst-case: $22.50/1M (Google >200K) * 1.055
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "stop",
      "tools",
      "tool_choice",
      "top_p",
      "top_k",
    ],
    ptbEnabled: true,
    priority: 100,
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-4.5-sonnet:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/claude-sonnet-4-5-20250929",
    version: "20250929",
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 64000,
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
    priority: 2,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeSonnet45ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
