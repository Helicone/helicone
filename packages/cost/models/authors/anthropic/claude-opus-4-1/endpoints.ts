import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus41ModelName } from "./model";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    providerModelId: "claude-opus-4-1-20250805",
    provider: "anthropic",
    author: "anthropic",
    version: "20250805",
    priority: 2,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        web_search: 0.00001, // $10 per 1000 searches
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
    supportedPlugins: ["web"],
    ptbEnabled: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },

  "claude-opus-4-1:vertex": {
    providerModelId: "claude-opus-4-1@20250805",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    crossRegion: true,
    priority: 3,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        web_search: 0.00001, // $10 per 1000 searches
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
    responseFormat: "ANTHROPIC",
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
    priority: 3,
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.000075,
        web_search: 0.00001, // $10 per 1000 searches
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
    ptbEnabled: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "us-east-1": {},
    },
  },
  "claude-opus-4-1:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-opus-4.1",
    pricing: [
      {
        threshold: 0,
        input: 0.00001583, // $15.83/1M - worst-case: $15.00/1M (Anthropic/Google) * 1.055
        output: 0.00007913, // $79.13/1M - worst-case: $75.00/1M (Anthropic/Google) * 1.055
        web_search: 0.00001, // $10 per 1000 searches
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 32000,
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
  "claude-opus-4-1:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/claude-opus-4-1-20250805",
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
    ptbEnabled: true,
    requireExplicitRouting: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeOpus41ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
