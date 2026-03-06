import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT54ModelName } from "./models";

export const endpoints = {
  "gpt-5.4:openai": {
    providerModelId: "gpt-5.4",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.25 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
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
      "temperature",
      "top_p",
      "logprobs",
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.4",
    pricing: [
      {
        threshold: 0,
        input: 0.000002_6375, // $2.6375/1M - worst-case: $2.50/1M (OpenAI) * 1.055
        output: 0.000015_825, // $15.825/1M - worst-case: $15.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
      {
        threshold: 272000,
        input: 0.000005_275, // $5.275/1M - worst-case: $5.00/1M (OpenAI) * 1.055
        output: 0.000023_7375, // $23.7375/1M - worst-case: $22.50/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
      "temperature",
      "top_p",
      "logprobs",
      "presence_penalty",
      "frequency_penalty",
      "logit_bias",
      "max_tokens",
      "top_logprobs",
      "verbosity",
    ],
    unsupportedParameters: [],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5.4",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.25 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
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
      "temperature",
      "top_p",
      "logprobs",
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.4",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.25 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: ["max_completion_tokens", "stop"],
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
  "gpt-5.4-2026-03-05:openai": {
    providerModelId: "gpt-5.4-2026-03-05",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
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
      "temperature",
      "top_p",
      "logprobs",
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4-2026-03-05:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.4-2026-03-05",
    pricing: [
      {
        threshold: 0,
        input: 0.000002_6375, // $2.6375/1M - worst-case: $2.50/1M (OpenAI) * 1.055
        output: 0.000015_825, // $15.825/1M - worst-case: $15.00/1M (OpenAI) * 1.055
        web_search: 0.01,
      },
      {
        threshold: 272000,
        input: 0.000005_275, // $5.275/1M - worst-case: $5.00/1M (OpenAI) * 1.055
        output: 0.000023_7375, // $23.7375/1M - worst-case: $22.50/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
      "temperature",
      "top_p",
      "logprobs",
      "presence_penalty",
      "frequency_penalty",
      "logit_bias",
      "max_tokens",
      "top_logprobs",
      "verbosity",
    ],
    unsupportedParameters: [],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4-2026-03-05:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5.4-2026-03-05",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
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
      "temperature",
      "top_p",
      "logprobs",
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.4-2026-03-05:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.4-2026-03-05",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        web_search: 0.01,
        cacheMultipliers: {
          cachedInput: 0.1,
        },
      },
      {
        threshold: 272000,
        input: 0.000005, // $5.00 per 1M tokens (2x for >272K context)
        output: 0.0000225, // $22.50 per 1M tokens (1.5x for >272K context)
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: ["max_completion_tokens", "stop"],
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
  Record<`${GPT54ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
