import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT55ModelName } from "./models";

export const endpoints = {
  "gpt-5.5:openai": {
    providerModelId: "gpt-5.5-2026-04-23",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000050, // $5.00 per 1M tokens
        output: 0.000030, // $30.00 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.50 per 1M tokens
        },
      },
      {
        threshold: 272000,
        input: 0.000010, // $10.00 per 1M tokens (2x for >272K context)
        output: 0.000045, // $45.00 per 1M tokens (1.5x for >272K context)
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.5:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-5.5",
    pricing: [
      {
        threshold: 0,
        input: 0.000005_275, // $5.275/1M - worst-case: $5/1M (OpenAI) * 1.055
        output: 0.000031_65, // $31.65/1M - worst-case: $30.00/1M (OpenAI) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
      {
        threshold: 272000,
        input: 0.000010_55, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
        output: 0.000047_475, // $47.475/1M - worst-case: $45.00/1M (OpenAI) * 1.055
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
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT55ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
