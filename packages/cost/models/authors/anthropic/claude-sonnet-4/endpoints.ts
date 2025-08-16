import { ProviderName } from "@/cost/models/providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet4ModelName } from "./model";

export const endpoints = {
  "claude-sonnet-4:anthropic": {
    providerModelId: "claude-sonnet-4-20250514",
    provider: "anthropic",
    version: "20250514",
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
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
    pricing: {
      prompt: 3,
      completion: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
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
} satisfies Partial<
  Record<`${ClaudeSonnet4ModelName}:${ProviderName}`, ModelProviderConfig>
>;
