import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet4520250929ModelName } from "./model";

export const endpoints = {
  "claude-sonnet-4-5-20250929:anthropic": {
    providerModelId: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    author: "anthropic",
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
        // cacheMultipliers inherited from base tier
      },
    ],
    contextLength: 1000000,
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
  "claude-sonnet-4-5-20250929:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-sonnet-4-5@20250929",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
      },
    ],
    contextLength: 1000000,
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
  "claude-sonnet-4-5-20250929:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",
    version: "20250929",
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
      {
        threshold: 200000,
        input: 0.000006,
        output: 0.0000225,
      },
    ],
    contextLength: 1000000,
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
  "claude-sonnet-4-5-20250929:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-sonnet-4.5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000633, // $6.33/1M - worst-case: $6.00/1M (Google >200K) * 1.055
        output: 0.00002374, // $23.74/1M - worst-case: $22.50/1M (Google >200K) * 1.055
      },
      {
        threshold: 200000,
        input: 0.00000633, // 0.000006 * 1.055
        output: 0.0000237375, // 0.0000225 * 1.055
      },
    ],
    contextLength: 1000000,
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
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-sonnet-4-5-20250929:helicone": {
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
    contextLength: 1000000,
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
} satisfies Partial<
  Record<
    `${ClaudeSonnet4520250929ModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
