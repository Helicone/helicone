import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini31ProPreviewModelName } from "./model";

export const endpoints = {
  "gemini-3.1-pro-preview:google-ai-studio": {
    providerModelId: "gemini-3.1-pro-preview",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2/1M tokens
        output: 0.000012, // $12/1M tokens (including thinking tokens)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.20/1M = 10% of input
        },
        cacheStoragePerHour: 0.0000045, // $4.50/1M tokens per hour
      },
      {
        threshold: 200000,
        input: 0.000004, // $4/1M tokens (over 200K context)
        output: 0.000018, // $18/1M tokens (over 200K context)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.40/1M = 10% of $4
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "include_reasoning",
      "max_tokens",
      "reasoning",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_p",
    ],
    rateLimits: {
      rpm: 2_000,
      tpm: 8_000_000,
    },
    ptbEnabled: true,
    responseFormat: "GOOGLE",
    endpointConfigs: {
      "*": {},
    },
  },

  "gemini-3.1-pro-preview:vertex": {
    providerModelId: "gemini-3.1-pro-preview",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2/1M tokens
        output: 0.000012, // $12/1M tokens (including thinking tokens)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.20/1M = 10% of input
        },
        cacheStoragePerHour: 0.0000045, // $4.50/1M tokens per hour
      },
      {
        threshold: 200000,
        input: 0.000004, // $4/1M tokens (over 200K context)
        output: 0.000018, // $18/1M tokens (over 200K context)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.40/1M = 10% of $4
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "include_reasoning",
      "max_tokens",
      "reasoning",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_p",
    ],
    responseFormat: "GOOGLE",
    ptbEnabled: true,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-3.1-pro-preview",
      },
    },
  },

  "gemini-3.1-pro-preview:novita": {
    providerModelId: "pa/gemini-3.1-pro-preview",
    provider: "novita",
    author: "google",
    pricing: [
      {
        threshold: 0,
        // Novita pricing with 30% discount from Google's $2/$12
        input: 0.0000014, // $1.40/1M tokens (30% off $2)
        output: 0.0000084, // $8.40/1M tokens (30% off $12)
      },
      {
        threshold: 200000,
        // Novita pricing with 30% discount from Google's $4/$18
        input: 0.0000028, // $2.80/1M tokens (30% off $4)
        output: 0.0000126, // $12.60/1M tokens (30% off $18)
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },

  "gemini-3.1-pro-preview:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-3.1-pro-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.00000211, // $2.11/1M - $2.00/1M * 1.055 (OpenRouter markup)
        output: 0.00001266, // $12.66/1M - $12.00/1M * 1.055
      },
      {
        threshold: 200000,
        input: 0.00000422, // $4.22/1M - $4.00/1M * 1.055 (over 200K context)
        output: 0.00001899, // $18.99/1M - $18.00/1M * 1.055 (over 200K context)
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },

  "gemini-3.1-pro-preview:helicone": {
    provider: "helicone",
    author: "google",
    providerModelId: "pa/gemini-3.1-pro-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2/1M tokens (same as Google)
        output: 0.000012, // $12/1M tokens (same as Google)
      },
      {
        threshold: 200000,
        input: 0.000004, // $4/1M tokens (over 200K context)
        output: 0.000018, // $18/1M tokens (over 200K context)
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "include_reasoning",
      "max_tokens",
      "reasoning",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Gemini31ProPreviewModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
