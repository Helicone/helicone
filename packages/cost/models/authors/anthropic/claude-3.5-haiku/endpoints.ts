import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude35HaikuModelName } from "./model";

export const endpoints = {
  "claude-3.5-haiku:anthropic": {
    provider: "anthropic",
    providerModelId: "claude-3-5-haiku-20241022",
    pricing: {
      prompt: 0.0000008,
      completion: 0.000004,
      cacheRead: 0.00000008,
      cacheWrite: {
        "5m": 0.000001,
        "1h": 0.0000016,
        default: 0.000001,
      },
    },
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
    providerModelId: "claude-3-5-haiku@20241022",
    pricing: {
      prompt: 0.0000008,
      completion: 0.000004,
      cacheRead: 0.00000008,
      cacheWrite: 0.000001,
    },
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
    providerModelId: "anthropic.claude-3-5-haiku-20241022-v1:0",
    version: "20241022",
    crossRegion: true,
    pricing: {
      prompt: 0.0000008,
      completion: 0.000004,
      cacheRead: 0.00000008,
      cacheWrite: 0.000001,
    },
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

  // Bedrock not currently supported
  // "claude-3.5-haiku:bedrock": {
  //   modelId: "claude-3.5-haiku",
  //   provider: "bedrock",
  //   pricing: {
  //     prompt: 0.8,
  //     completion: 4,
  //     cacheRead: 0.08,
  //     cacheWrite: {
  //       "5m": 1,
  //       "1h": 1.6,
  //       default: 1,
  //     },
  //   },
  //   contextLength: 200000,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "tools",
  //     "tool_choice",
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //   ],
  //   ptbEnabled: true,
  //   deployments: {
  //     "us-west-2": {
  //       providerModelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  //     },
  //   },
  // },
} satisfies Partial<
  Record<`${Claude35HaikuModelName}:${ProviderName}`, ModelProviderConfig>
>;
