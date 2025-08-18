import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus41ModelName } from "./model";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    providerModelId: "claude-opus-4-1-20250805",
    provider: "anthropic",
    version: "20250805",
    pricing: {
      prompt: 0.000015,
      completion: 0.000075,
      cacheRead: 0.0000015,
      cacheWrite: {
        "5m": 0.00001875,
        "1h": 0.00003,
        default: 0.00001875,
      },
    },
    contextLength: 200000,
    maxCompletionTokens: 32000,
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

  "claude-opus-4-1:vertex": {
    providerModelId: "claude-opus-4-1@20250805",
    provider: "vertex",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 0.000015,
      completion: 0.000075,
      cacheRead: 0.0000015,
      cacheWrite: 0.00001875,
    },
    contextLength: 200000,
    maxCompletionTokens: 32000,
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
        providerModelId: "claude-opus-4-1@20250805",
      },
    },
  },
} satisfies Partial<
  Record<`${ClaudeOpus41ModelName}:${ProviderName}`, ModelProviderConfig>
>;
