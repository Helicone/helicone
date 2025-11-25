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
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-mini:openai": {
    providerModelId: "gpt-5-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-mini:azure": {
    providerModelId: "gpt-5-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.12,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "structured_outputs",
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
  "gpt-5-nano:openai": {
    providerModelId: "gpt-5-nano",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
        web_search: 0.02, // $20 per 1000 searches
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
      "stop",
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
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026, // $0.26/1M - worst-case: $0.25/1M (OpenAI) * 1.055
        output: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (OpenAI) * 1.055
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-nano:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-nano",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005, // $0.05/1M - worst-case: $0.05/1M (OpenAI) * 1.055
        output: 0.00000042, // $0.42/1M - worst-case: $0.40/1M (OpenAI) * 1.055
        web_search: 0.02, // $20 per 1000 searches
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
      "stop",
    ],
    ptbEnabled: true,
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
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
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
  "gpt-5:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.104, // $0.13 per 1M tokens
        },
      },
    ],
    contextLength: 272_000,
    maxCompletionTokens: 128_000,
    rateLimits: {
      rpm: 500,
    },
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
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
  "gpt-5-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25 per 1M tokens
        output: 0.000002, // $2.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1, // $0.025 per 1M tokens
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-5-nano:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-nano",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005, // $0.05 per 1M tokens
        output: 0.0000004, // $0.40 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1, // $0.005 per 1M tokens
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 8192,
    supportedParameters: ["max_completion_tokens"],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-chat-latest:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-chat-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
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
      "n",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-pro:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.000015, // $15.00 per 1M tokens
        output: 0.00012, // $120.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-codex:openai": {
    providerModelId: "gpt-5-codex",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-codex:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-codex",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132, // $1.32/1M - worst-case: $1.25/1M (OpenAI) * 1.055
        output: 0.00001055, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        web_search: 0.02, // $20 per 1000 searches
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
  "gpt-5-codex:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-codex",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
        web_search: 0.02, // $20 per 1000 searches
        cacheMultipliers: {
          cachedInput: 0.1, // $0.125 per 1M tokens
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
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
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-2025-08-07:openai": {
    providerModelId: "gpt-5-2025-08-07",
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
  "gpt-5-2025-08-07:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5-2025-08-07",
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
  "gpt-5-2025-08-07:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000132,
        output: 0.00001055,
        web_search: 0.01,
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
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
  "gpt-5-2025-08-07:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-2025-08-07",
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
  "gpt-5-mini-2025-08-07:openai": {
    providerModelId: "gpt-5-mini-2025-08-07",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.01,
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
  "gpt-5-mini-2025-08-07:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5-mini-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.104,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 200,
      tpm: 200000,
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
  "gpt-5-mini-2025-08-07:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-mini-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026,
        output: 0.00000211,
        web_search: 0.01,
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
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
  "gpt-5-mini-2025-08-07:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-mini-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
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
  "gpt-5-nano-2025-08-07:openai": {
    providerModelId: "gpt-5-nano-2025-08-07",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
        web_search: 0.01,
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
  "gpt-5-nano-2025-08-07:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5-nano-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.104,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 200,
      tpm: 200000,
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
  "gpt-5-nano-2025-08-07:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-nano-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.00000042,
        web_search: 0.01,
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
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
  "gpt-5-nano-2025-08-07:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-nano-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
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
  "gpt-5-chat-2025-08-07:openai": {
    providerModelId: "gpt-5-chat-2025-08-07",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-5-chat-2025-08-07:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5-chat-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.104,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 200,
      tpm: 200000,
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
  "gpt-5-chat-2025-08-07:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5-chat-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026,
        output: 0.00000211,
        web_search: 0.01,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  "gpt-5-chat-2025-08-07:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-chat-2025-08-07",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
  Record<`${GPT5ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
