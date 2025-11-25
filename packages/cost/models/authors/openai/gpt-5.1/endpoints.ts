import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT51ModelName } from "./models";

export const endpoints = {
  "gpt-5.1:openai": {
    providerModelId: "gpt-5.1",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
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
      "stop",
      "verbosity",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-codex:openai": {
    providerModelId: "gpt-5.1-codex",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-codex:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.1-codex",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-codex-mini:openai": {
    providerModelId: "gpt-5.1-codex-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25 per 1M tokens
        output: 0.000002, // $2.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.025 per 1M tokens
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-codex-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.1-codex-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026, // $0.26/1M - worst-case: $0.25/1M (OpenAI) * 1.055
        output: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-chat-latest:openai": {
    providerModelId: "gpt-5.1-chat-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
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
      "stop",
      "verbosity",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "n",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-chat-latest:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.1-chat-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "n",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "codex-mini-latest:openai": {
    providerModelId: "codex-mini-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000015, // $1.50 per 1M tokens
        output: 0.000006, // $6.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.25, // $0.375 per 1M tokens
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "codex-mini-latest:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/codex-mini-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.00000158, // $1.58/1M - worst-case: $1.50/1M (OpenAI) * 1.055
        output: 0.00000633, // $6.33/1M - worst-case: $6.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-2025-11-13:openai": {
    providerModelId: "gpt-5.1-2025-11-13",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        web_search: 0.01,
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
      "stop",
      "verbosity",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-2025-11-13:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5.1-2025-11-13",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.104,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 50,
      tpm: 100000,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
      "verbosity",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-2025-11-13:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.1-2025-11-13",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132,
        output: 0.00001055,
        web_search: 0.01,
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
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.1-2025-11-13:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.1-2025-11-13",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_completion_tokens",
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT51ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
