import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet4ModelName } from "./model";

export const endpoints = {
  "claude-sonnet-4:anthropic": {
    providerModelId: "claude-sonnet-4-20250514",
    provider: "anthropic",
    author: "anthropic",
    version: "20250514",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
    supportedPlugins: ["web"],
    ptbEnabled: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-sonnet-4:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-sonnet-4@20250514",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
        providerModelId: "claude-sonnet-4@20250514",
      },
    },
  },
  "claude-sonnet-4:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-sonnet-4-20250514-v1:0",
    version: "20250514",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
  "claude-sonnet-4:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-sonnet-4",
    pricing: [
      {
        threshold: 0,
        input: 0.00000633, // $6.33/1M - worst-case: $6.00/1M (Google >200K) * 1.055
        output: 0.00002374, // $23.74/1M - worst-case: $22.50/1M (Google >200K) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 1000000, // OpenRouter shows 1M context for this model
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
  "claude-sonnet-4:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/cd-st-4-20250514",
    version: "20250514",
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeSonnet4ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
