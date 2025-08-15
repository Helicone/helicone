import { ProviderName } from "@/cost/models/providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus41ModelName } from "./model";

export const endpoints = {
  "claude-opus-4-1:anthropic": {
    providerModelId: "claude-opus-4-1-20250805",
    provider: "anthropic",
    version: "20250805",
    pricing: {
      prompt: 15,
      completion: 75,
      cacheRead: 1.5,
      cacheWrite: {
        "5m": 18.75,
        "1h": 30,
        default: 18.75,
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
      prompt: 15,
      completion: 75,
      cacheRead: 1.5,
      cacheWrite: 18.75,
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
