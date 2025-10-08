import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude35SonnetV2ModelName } from "./model";

export const endpoints = {
  "claude-3.5-sonnet-v2:anthropic": {
    providerModelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    author: "anthropic",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-3.5-sonnet-v2:vertex": {
    providerModelId: "claude-3-5-sonnet-v2@20241022",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      global: {
        providerModelId: "claude-3-5-sonnet-v2@20241022",
      },
    },
  },
  "claude-3.5-sonnet-v2:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    version: "20241022",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
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
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "us-east-1": {},
    },
  },
  "claude-3.5-sonnet-v2:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-3.5-sonnet",
    pricing: [
      {
        threshold: 0,
        input: 0.000003165, // $3.17/1M - worst-case: $3.00/1M (Anthropic/Amazon Bedrock) * 1.055
        output: 0.00001583, // $15.83/1M - worst-case: $15.00/1M (Anthropic/Amazon Bedrock) * 1.055,
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
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Claude35SonnetV2ModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
