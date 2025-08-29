import { ProviderName } from "../../../providers";
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
          read: 0.1,
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
          read: 0.1,
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
          read: 0.1,
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
  },
} satisfies Partial<
  Record<`${Claude35HaikuModelName}:${ProviderName}`, ModelProviderConfig>
>;
