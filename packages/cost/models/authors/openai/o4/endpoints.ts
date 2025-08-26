import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O4ModelName } from "./models";

export const endpoints = {
  "o4-mini:openai": {
    providerModelId: "o4-mini",
    provider: "openai",
    pricing: {
      prompt: 0.0000011,
      completion: 0.0000044,
      cacheRead: 0.000000275,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o4-mini-high:openai": {
    providerModelId: "o4-mini-high-2025-04-16",
    provider: "openai",
    pricing: {
      prompt: 0.0000011,
      completion: 0.0000044,
      cacheRead: 0.000000275,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O4ModelName}:${ProviderName}`, ModelProviderConfig>
>;
