import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude35SonnetV2ModelName } from "./model";

export const endpoints = {
  "claude-3.5-sonnet-v2:anthropic": {
    providerModelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: {
        "5m": 0.00000375,
        "1h": 0.000006,
        default: 0.00000375,
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
  // "claude-3.5-sonnet-v2:bedrock": {
  //   providerModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  //   provider: "bedrock",
  //   crossRegion: true,
  //   pricing: {
  //     prompt: 3,
  //     completion: 15,
  //     cacheRead: 0.3,
  //     cacheWrite: {
  //       "5m": 3.75,
  //       "1h": 6,
  //       default: 3.75,
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
  //   endpointConfigs: {
  //     "*": {},
  //   },
  // },

  // "claude-3.5-sonnet-v2:bedrock": {
  //   modelId: "claude-3.5-sonnet-v2",
  //   provider: "bedrock",
  //   pricing: {
  //     prompt: 3,
  //     completion: 15,
  //     cacheRead: 0.3,
  //     cacheWrite: {
  //       "5m": 3.75,
  //       "1h": 6,
  //       default: 3.75,
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
  //       providerModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //     },
  //     "eu-west-1": {
  //       providerModelId: "eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
  //     },
  //   },
  // },

  "claude-3.5-sonnet-v2:vertex": {
    providerModelId: "claude-3-5-sonnet-v2@20241022",
    provider: "vertex",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: 0.00000375,
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
      global: {
        providerModelId: "claude-3-5-sonnet-v2@20241022",
      },
    },
  },
} satisfies Partial<
  Record<`${Claude35SonnetV2ModelName}:${ProviderName}`, ModelProviderConfig>
>;
