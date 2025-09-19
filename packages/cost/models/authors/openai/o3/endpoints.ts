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
      "max_completion_tokens",
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
      "max_completion_tokens",
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
      "max_completion_tokens",
      "response_format",
    ],
    ptbEnabled: true,
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
      "max_completion_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/o3",
    pricing: [
      {
        threshold: 0,
        input: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (OpenAI) * 1.055
        output: 0.00000844, // $8.44/1M - worst-case: $8.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 200_000,
    maxCompletionTokens: 100_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/o3-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000116, // $1.16/1M - worst-case: $1.10/1M (OpenAI) * 1.055
        output: 0.00000464, // $4.64/1M - worst-case: $4.40/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 200_000,
    maxCompletionTokens: 100_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-pro:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/o3-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.0000211, // $21.10/1M - worst-case: $20.00/1M (OpenAI) * 1.055
        output: 0.0000844, // $84.40/1M - worst-case: $80.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 200_000,
    maxCompletionTokens: 100_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
