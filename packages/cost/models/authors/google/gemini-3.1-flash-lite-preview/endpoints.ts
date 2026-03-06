import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini31FlashLitePreviewModelName } from "./model";

export const endpoints = {
  "gemini-3.1-flash-lite-preview:google-ai-studio": {
    providerModelId: "gemini-3.1-flash-lite-preview",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25/1M tokens (text/image/video)
        output: 0.0000015, // $1.50/1M tokens (including thinking tokens)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.025/1M = 10% of input
        },
        cacheStoragePerHour: 0.000001, // $1.00/1M tokens per hour
        audio: {
          input: 0.0000005, // $0.50/1M audio tokens
          cachedInputMultiplier: 0.1, // $0.05/1M = 10% of audio input
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
  "gemini-3.1-flash-lite-preview:vertex": {
    providerModelId: "gemini-3.1-flash-lite-preview",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25/1M tokens (text/image/video)
        output: 0.0000015, // $1.50/1M tokens (including thinking tokens)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.025/1M = 10% of input
        },
        cacheStoragePerHour: 0.000001, // $1.00/1M tokens per hour
        audio: {
          input: 0.0000005, // $0.50/1M audio tokens
          cachedInputMultiplier: 0.1, // $0.05/1M = 10% of audio input
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
        providerModelId: "gemini-3.1-flash-lite-preview",
      },
    },
  },
  "gemini-3.1-flash-lite-preview:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-3.1-flash-lite-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.00000026375, // $0.26375/1M - $0.25/1M * 1.055 (OpenRouter markup)
        output: 0.0000015825, // $1.5825/1M - $1.50/1M * 1.055
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
  "gemini-3.1-flash-lite-preview:helicone": {
    provider: "helicone",
    author: "google",
    providerModelId: "pa/gemini-3.1-flash-lite-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25/1M tokens (same as Google)
        output: 0.0000015, // $1.50/1M tokens (same as Google)
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
  Record<
    `${Gemini31FlashLitePreviewModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
