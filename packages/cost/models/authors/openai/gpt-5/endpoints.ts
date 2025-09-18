import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT5ModelName } from "./models";

export const endpoints = {
  "gpt-5:openai": {
    providerModelId: "gpt-5",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 15000,
      tpm: 40000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-mini:openai": {
    providerModelId: "gpt-5-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 30000,
      tpm: 180000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-nano:openai": {
    providerModelId: "gpt-5-nano",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 30000,
      tpm: 180000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-chat-latest:openai": {
    providerModelId: "gpt-5-chat-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 15000,
      tpm: 40000000,
      tpd: 15000000000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 400_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
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
  "gpt-5-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026, // $0.26/1M - worst-case: $0.25/1M (OpenAI) * 1.055
        output: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 400_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
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
  "gpt-5-nano:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-nano",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005, // $0.05/1M - worst-case: $0.05/1M (OpenAI) * 1.055
        output: 0.00000042, // $0.42/1M - worst-case: $0.40/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 400_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
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
  "gpt-5-chat-latest:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-chat",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
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
  Record<`${GPT5ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
