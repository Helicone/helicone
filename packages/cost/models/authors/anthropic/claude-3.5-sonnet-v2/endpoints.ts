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
  "claude-3.5-sonnet-v2:bedrock": {
    provider: "bedrock",
    providerModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    version: "20241022",
    crossRegion: true,
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
      "us-east-1": {},
    },
  },
} satisfies Partial<
  Record<`${Claude35SonnetV2ModelName}:${ProviderName}`, ModelProviderConfig>
>;
