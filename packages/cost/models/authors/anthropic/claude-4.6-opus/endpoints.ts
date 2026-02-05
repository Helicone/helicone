import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus46ModelName } from "./model";

export const endpoints = {
  "claude-4.6-opus:anthropic": {
    providerModelId: "claude-opus-4-6-20260205",
    provider: "anthropic",
    author: "anthropic",
    version: "20260205",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 / MTok
        output: 0.000025, // $25 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.50 / MTok (10% of $5)
          write5m: 1.25, // $6.25 / MTok (125% of $5)
          write1h: 2.0, // $10 / MTok (200% of $5)
        },
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
    supportedPlugins: ["web"],
    ptbEnabled: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },

  "claude-4.6-opus:vertex": {
    providerModelId: "claude-opus-4-6@20260205",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 / MTok
        output: 0.000025, // $25 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.50 / MTok (10% of $5)
          write5m: 1.25, // $6.25 / MTok (125% of $5)
        },
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
        providerModelId: "claude-opus-4-6@20260205",
      },
    },
  },
  "claude-4.6-opus:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-opus-4-6-20260205-v1:0",
    version: "20260205",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 / MTok
        output: 0.000025, // $25 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.50 / MTok (10% of $5)
          write5m: 1.25, // $6.25 / MTok (125% of $5)
        },
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
  "claude-4.6-opus:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-opus-4.6",
    pricing: [
      {
        threshold: 0,
        input: 0.000005275, // $5.275/1M - worst-case: $5.00/1M (Anthropic/Google) * 1.055
        output: 0.000026375, // $26.375/1M - worst-case: $25.00/1M (Anthropic/Google) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
} satisfies Partial<
  Record<`${ClaudeOpus46ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
