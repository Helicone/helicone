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
  "claude-3.5-sonnet-v2:vertex": {
    providerModelId: "claude-3-5-sonnet-v2@20241022",
    provider: "vertex",
    author: "anthropic",
    version: "vertex-2023-10-16",
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
} satisfies Partial<
  Record<
    `${Claude35SonnetV2ModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
