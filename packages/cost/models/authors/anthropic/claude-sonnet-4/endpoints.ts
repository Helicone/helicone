import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet4ModelName } from "./model";

export const endpoints = {
  "claude-sonnet-4:anthropic": {
    providerModelId: "claude-sonnet-4-20250514",
    provider: "anthropic",
    version: "20250514",
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
    endpointConfigs: {
      "*": {},
    },
  },
  "claude-sonnet-4:vertex": {
    provider: "vertex",
    providerModelId: "claude-sonnet-4@20250514",
    version: "vertex-2023-10-16",
    ptbEnabled: true,
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: 0.00000375,
    },
    contextLength: 200000,
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
    endpointConfigs: {
      global: {
        providerModelId: "claude-sonnet-4@20250514",
      },
    },
  },
  "claude-sonnet-4:bedrock": {
    provider: "bedrock",
    providerModelId: "anthropic.claude-sonnet-4-20250514-v1:0",
    version: "20250514",
    crossRegion: true,
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: 0.00000375,
    },
    contextLength: 200000,
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
    endpointConfigs: {
      "us-east-1": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeSonnet4ModelName}:${ProviderName}`, ModelProviderConfig>
>;
