import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O3ModelName } from "./models";
export const endpoints = {
  "o3:openai": {
    providerModelId: "o3-2025-04-16",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000002,
        output: 0.000008,
        cacheMultipliers: {
          cachedInput: 0.25,
        },
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 5000000000,
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-pro:openai": {
    providerModelId: "o3-pro-2025-06-10",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00002,
        output: 0.00008,
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 5000000000,
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:openai": {
    providerModelId: "o3-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:azure": {
    providerModelId: "o3-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    rateLimits: {
      rpm: 20,
      tpm: 200000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
