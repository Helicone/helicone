import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude45HaikuModelName } from "./model";

export const endpoints = {
  "claude-4.5-haiku:anthropic": {
    provider: "anthropic",
    author: "anthropic",
    providerModelId: "claude-haiku-4-5-20251001",
    priority: 3,
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000005,
        web_search: 0.00001, // $10 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
          write1h: 2.0,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    supportedPlugins: ["web"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
    responseFormat: "ANTHROPIC",
  },
  "claude-4.5-haiku:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-haiku-4-5@20251001",
    crossRegion: false,
    priority: 4,
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000005,
        web_search: 0.00001, // $10 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
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
    endpointConfigs: {
      "us-east5": {}, // Use specific region for Claude
    },
    responseFormat: "ANTHROPIC",
  },
  "claude-4.5-haiku:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-haiku-4-5-20251001-v1:0",
    version: "20251001",
    crossRegion: true,
    priority: 4,
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000005,
        web_search: 0.00001, // $10 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
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
    endpointConfigs: {
      "us-east-1": {},
    },
    responseFormat: "ANTHROPIC",
  },
  "claude-4.5-haiku:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-4.5-haiku",
    pricing: [
      {
        threshold: 0,
        input: 0.00000105, // $1.05/1M - worst-case: $1.00/1M (Anthropic/Google) * 1.055
        output: 0.00000527, // $5.27/1M - worst-case: $5.00/1M (Anthropic/Google) * 1.055,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
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
    priority: 100,
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-4.5-haiku:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/claude-haiku-4-5-20251001",
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000005,
        cacheMultipliers: {
          cachedInput: 0.1,
          write5m: 1.25,
          write1h: 2.0,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
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
    priority: 2,
    endpointConfigs: {
      "*": {},
    },
    responseFormat: "ANTHROPIC",
  },
} satisfies Partial<
  Record<`${Claude45HaikuModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
