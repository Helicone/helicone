import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet46ModelName } from "./model";

export const endpoints = {
  "claude-4.6-sonnet:anthropic": {
    providerModelId: "claude-sonnet-4-6",
    provider: "anthropic",
    author: "anthropic",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3 / MTok
        output: 0.000015, // $15 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30 / MTok (10% of $3)
          write5m: 1.25, // $3.75 / MTok (125% of $3)
          write1h: 2.0, // $6.00 / MTok (200% of $3)
        },
      },
      {
        threshold: 200000,
        input: 0.000006, // $6 / MTok
        output: 0.0000225, // $22.50 / MTok
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

  "claude-4.6-sonnet:vertex": {
    providerModelId: "claude-sonnet-4-6@20260217", // Vertex uses dated format
    provider: "vertex",
    author: "anthropic",
    ptbEnabled: true,
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3 / MTok
        output: 0.000015, // $15 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30 / MTok (10% of $3)
          write5m: 1.25, // $3.75 / MTok (125% of $3)
        },
      },
      {
        threshold: 200000,
        input: 0.000006, // $6 / MTok
        output: 0.0000225, // $22.50 / MTok
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
        providerModelId: "claude-sonnet-4-6@20260217",
      },
    },
  },

  "claude-4.6-sonnet:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-sonnet-4-6-20260217-v1:0",
    version: "20260217",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3 / MTok
        output: 0.000015, // $15 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30 / MTok (10% of $3)
          write5m: 1.25, // $3.75 / MTok (125% of $3)
        },
      },
      {
        threshold: 200000,
        input: 0.000006, // $6 / MTok
        output: 0.0000225, // $22.50 / MTok
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

  "claude-4.6-sonnet:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/claude-sonnet-4-6",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3 / MTok
        output: 0.000015, // $15 / MTok
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30 / MTok (10% of $3)
          write5m: 1.25, // $3.75 / MTok (125% of $3)
          write1h: 2.0, // $6.00 / MTok (200% of $3)
        },
      },
      {
        threshold: 200000,
        input: 0.000006, // $6 / MTok
        output: 0.0000225, // $22.50 / MTok
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
    `${ClaudeSonnet46ModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
