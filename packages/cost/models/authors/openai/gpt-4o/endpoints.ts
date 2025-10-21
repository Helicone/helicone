import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT4oModelName } from "./models";
export const endpoints = {
  "gpt-4o:openai": {
    providerModelId: "gpt-4o",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 15000000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-4o:azure": {
    providerModelId: "gpt-4o",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 300,
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
  "gpt-4o-mini:openai": {
    providerModelId: "gpt-4o-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
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
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-4o-mini:azure": {
    providerModelId: "gpt-4o-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 2000,
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
  "chatgpt-4o-latest:openai": {
    providerModelId: "chatgpt-4o-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.00002,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 15000000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-4o:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-4o",
    pricing: [
      {
        threshold: 0,
        input: 0.00000264, // $2.64/1M - worst-case: $2.50/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
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
  "gpt-4o-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-4o-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000016, // $0.16/1M - worst-case: $0.15/1M (OpenAI) * 1.055
        output: 0.00000063, // $0.63/1M - worst-case: $0.60/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
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
  "chatgpt-4o-latest:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/chatgpt-4o-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.00000528, // $5.28/1M - worst-case: $5.00/1M (OpenAI) * 1.055
        output: 0.00001582, // $15.82/1M - worst-case: $15.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
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
  "gpt-4o:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4p",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4o-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4p-m",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015, // $0.15 per 1M tokens
        output: 0.0000006, // $0.60 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT4oModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
