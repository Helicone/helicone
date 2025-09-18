import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude35HaikuModelName } from "./model";

export const endpoints = {
  "claude-3.5-haiku:anthropic": {
    provider: "anthropic",
    author: "anthropic",
    providerModelId: "claude-3-5-haiku-20241022",
    pricing: [
      {
        threshold: 0,
        input: 0.0000008,
        output: 0.000004,
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-3.5-haiku:vertex": {
    provider: "vertex",
    author: "anthropic",
    providerModelId: "claude-3-5-haiku@20241022",
    pricing: [
      {
        threshold: 0,
        input: 0.0000008,
        output: 0.000004,
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
    ptbEnabled: false,
    endpointConfigs: {
      global: {},
    },
  },
  "claude-3.5-haiku:bedrock": {
    provider: "bedrock",
    author: "anthropic",
    providerModelId: "anthropic.claude-3-5-haiku-20241022-v1:0",
    version: "20241022",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.0000008,
        output: 0.000004,
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
    ptbEnabled: false,
    endpointConfigs: {
      "us-east-1": {},
    },
  },
  "claude-3.5-haiku:openrouter": {
    provider: "openrouter",
    author: "anthropic",
    providerModelId: "anthropic/claude-3.5-haiku",
    pricing: [
      {
        threshold: 0,
        input: 0.000000844, // $0.84/1M - worst-case: $0.80/1M (Anthropic/Google) * 1.055
        output: 0.00000422, // $4.22/1M - worst-case: $4.00/1M (Anthropic/Google) * 1.055
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
  Record<`${Claude35HaikuModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
