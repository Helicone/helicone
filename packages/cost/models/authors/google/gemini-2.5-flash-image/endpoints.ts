import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini25FlashImageModelName } from "./model";

export const endpoints = {
  "gemini-2.5-flash-image:google-ai-studio": {
    providerModelId: "gemini-2.5-flash-image",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30/1M input tokens
        output: 0.0000025, // $2.50/1M output tokens
        image: {
          input: 0.0000003, // Same as text input
          output: 0.0000025, // Same as text output for image tokens
        },
        cacheMultipliers: {
          cachedInput: 0.25,
          write5m: 1.0,
        },
        cacheStoragePerHour: 0.000001,
      },
    ],
    contextLength: 1048576,
    maxCompletionTokens: 65535,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    rateLimits: {
      rpm: 10_000,
      tpm: 8_000_000,
    },
    ptbEnabled: false,
    responseFormat: "GOOGLE",
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-2.5-flash-image:vertex": {
    providerModelId: "gemini-2.5-flash-image",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30/1M input tokens
        output: 0.0000025, // $2.50/1M output tokens
        image: {
          input: 0.0000003, // Same as text input
          output: 0.0000025, // Same as text output for image tokens
        },
        cacheMultipliers: {
          cachedInput: 0.25,
          write5m: 1.0,
        },
        cacheStoragePerHour: 0.000001,
      },
    ],
    contextLength: 1048576,
    maxCompletionTokens: 65535,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    responseFormat: "GOOGLE",
    ptbEnabled: false,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-2.5-flash-image",
      },
    },
  },
  "gemini-2.5-flash-image:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-2.5-flash-image",
    pricing: [
      {
        threshold: 0,
        input: 0.00000032, // $0.32/1M - worst-case: $0.30/1M (Google) * 1.055
        output: 0.00000264, // $2.64/1M - worst-case: $2.50/1M (Google) * 1.055
        image: {
          input: 0.00000032, // Same as text input with markup
          output: 0.00000264, // Same as text output with markup
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_535,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Gemini25FlashImageModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
