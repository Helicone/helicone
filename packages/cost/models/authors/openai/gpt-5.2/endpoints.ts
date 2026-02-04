import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT52ModelName } from "./models";

export const endpoints = {
  "gpt-5.2:openai": {
    providerModelId: "gpt-5.2",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000175, // $1.75 per 1M tokens
        output: 0.000014, // $14.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.175 per 1M tokens
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
  "gpt-5.2:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.2",
    pricing: [
      {
        threshold: 0,
        input: 0.000001_85, // $1.85/1M - worst-case: $1.75/1M (OpenAI) * 1.055
        output: 0.000014_77, // $14.77/1M - worst-case: $14.00/1M (OpenAI) * 1.055
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
  "gpt-5.2-pro:openai": {
    providerModelId: "gpt-5.2-pro",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000021_00, // $21.00 per 1M tokens
        output: 0.000168_00, // $168.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 5000000000,
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
  "gpt-5.2-pro:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.2-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.000022_16, // $22.16/1M - worst-case: $21.00/1M (OpenAI) * 1.055
        output: 0.000177_24, // $177.24/1M - worst-case: $168.00/1M (OpenAI) * 1.055
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
  "gpt-5.2-chat-latest:openai": {
    providerModelId: "gpt-5.2-chat-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000175, // $1.75 per 1M tokens
        output: 0.000014, // $14.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.175 per 1M tokens
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
  "gpt-5.2-chat-latest:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.2-chat-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.000001_85, // $1.85/1M - worst-case: $1.75/1M (OpenAI) * 1.055
        output: 0.000014_77, // $14.77/1M - worst-case: $14.00/1M (OpenAI) * 1.055
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
  "gpt-5.2-chat-latest:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.2-chat-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.00000175, // $1.75 per 1M tokens
        output: 0.000014, // $14.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.175 per 1M tokens
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
      "n",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.2:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.2",
    pricing: [
      {
        threshold: 0,
        input: 0.00000175, // $1.75 per 1M tokens
        output: 0.000014, // $14.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.175 per 1M tokens
        },
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
  "gpt-5.2-pro:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5.2-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.000021_00, // $21.00 per 1M tokens
        output: 0.000168_00, // $168.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
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
  "gpt-5.2:azure": {
    provider: "azure",
    author: "openai",
    providerModelId: "gpt-5.2",
    pricing: [
      {
        threshold: 0,
        input: 0.00000175, // $1.75 per 1M tokens
        output: 0.000014, // $14.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.175 per 1M tokens
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
} satisfies Partial<
  Record<`${GPT52ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
