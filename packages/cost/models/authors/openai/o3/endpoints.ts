import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O3ModelName } from "./models";

export const endpoints = {
  "o3:openai": {
    providerModelId: "o3-2025-04-16",
    provider: "openai",
    pricing: {
      prompt: 0.000002,
      completion: 0.000008,
      cacheRead: 0.0000005,
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
  "o3-pro:openai": {
    providerModelId: "o3-pro-2025-06-10",
    provider: "openai",
    pricing: {
      prompt: 0.00002,
      completion: 0.00008,
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
  "o3-mini:openai": {
    providerModelId: "o3-mini",
    provider: "openai",
    pricing: {
      prompt: 0.0000011,
      completion: 0.0000044,
      cacheRead: 0.00000055,
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
  "o3-mini-high:openai": {
    providerModelId: "o3-mini-high",
    provider: "openai",
    pricing: {
      prompt: 0.0000011,
      completion: 0.0000044,
      cacheRead: 0.00000055,
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
  Record<`${O3ModelName}:${ProviderName}`, ModelProviderConfig>
>;
