import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus4ModelName } from "./model";

export const endpoints = {
  "claude-opus-4:anthropic": {
    providerModelId: "claude-opus-4-20250514",
    provider: "anthropic",
    version: "20250514",
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
      "*": {},
    },
  },

  "claude-opus-4:vertex": {
    providerModelId: "claude-opus-4@20250514",
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
        providerModelId: "claude-opus-4@20250514",
      },
    },
  },
} satisfies Partial<
  Record<`${ClaudeOpus4ModelName}:${ProviderName}`, ModelProviderConfig>
>;
