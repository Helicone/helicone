import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT41ModelName } from "./models";
export const endpoints = {
  "gpt-4.1:openai": {
    providerModelId: "gpt-4.1",
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
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-mini:openai": {
    providerModelId: "gpt-4.1-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000001,
        cacheMultipliers: {
          cachedInput: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-nano:openai": {
    providerModelId: "gpt-4.1-nano",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        cacheMultipliers: {
          cachedInput: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1:azure": {
    providerModelId: "gpt-4.1",
    provider: "azure",
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
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 50,
      tpm: 50000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-mini:azure": {
    providerModelId: "gpt-4.1-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000004,
        output: 0.0000016,
        cacheMultipliers: {
          cachedInput: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 200,
      tpm: 200000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-nano:azure": {
    providerModelId: "gpt-4.1-nano",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        cacheMultipliers: {
          cachedInput: 0.3,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 200,
      tpm: 200000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-4.1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (OpenAI) * 1.055
        output: 0.00000844, // $8.44/1M - worst-case: $8.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 1_047_576,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-4.1-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000042, // $0.42/1M - worst-case: $0.40/1M (OpenAI) * 1.055
        output: 0.00000169, // $1.69/1M - worst-case: $1.60/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 1_047_576,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-nano:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-4.1-nano",
    pricing: [
      {
        threshold: 0,
        input: 0.00000011, // $0.11/1M - worst-case: $0.10/1M (OpenAI) * 1.055
        output: 0.00000042, // $0.42/1M - worst-case: $0.40/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 1_047_576,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT41ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
