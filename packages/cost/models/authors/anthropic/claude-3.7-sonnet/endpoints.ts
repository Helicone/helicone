import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude37SonnetModelName } from "./model";

export const endpoints = {
  "claude-3.7-sonnet:anthropic": {
    provider: "anthropic",
    providerModelId: "claude-3-7-sonnet-20250219",
    version: "20250219",
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: 0.00000375,
    },
    contextLength: 200000,
    maxCompletionTokens: 64000,
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

  "claude-3.7-sonnet:vertex": {
    provider: "vertex",
    providerModelId: "claude-3-7-sonnet@20250219",
    version: "vertex-2023-10-16",
    pricing: {
      prompt: 0.000003,
      completion: 0.000015,
      cacheRead: 0.0000003,
      cacheWrite: 0.00000375,
    },
    contextLength: 200000,
    maxCompletionTokens: 64000,
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
        providerModelId: "claude-3-7-sonnet@20250219",
      },
    },
  },
} satisfies Partial<
  Record<`${Claude37SonnetModelName}:${ProviderName}`, ModelProviderConfig>
>;
