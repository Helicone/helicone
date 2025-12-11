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
      "reasoning",
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
  "gpt-5.2:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.2",
    pricing: [
      {
        threshold: 0,
        input: 0.00000185, // $1.85/1M - worst-case: $1.75/1M (OpenAI) * 1.055
        output: 0.00001477, // $14.77/1M - worst-case: $14.00/1M (OpenAI) * 1.055
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
      "reasoning",
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
  Record<`${GPT52ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
