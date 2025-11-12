import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O4ModelName } from "./models";
export const endpoints = {
  "o4-mini:openai": {
    providerModelId: "o4-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.25,
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
  "o4-mini:azure": {
    providerModelId: "o4-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.25,
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    rateLimits: {
      rpm: 20,
      tpm: 20000,
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
  "o4-mini:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/o4-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00000116, // $1.16/1M - worst-case: $1.10/1M (OpenAI) * 1.055
        output: 0.00000464, // $4.64/1M - worst-case: $4.40/1M (OpenAI) * 1.055
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o4-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/o4-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011, // $1.10 per 1M tokens
        output: 0.0000044, // $4.40 per 1M tokens
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.25, // $0.275 per 1M tokens
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O4ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
