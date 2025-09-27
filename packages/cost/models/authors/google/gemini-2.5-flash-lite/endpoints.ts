import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini25FlashLiteModelName } from "./model";

export const endpoints = {
  "gemini-2.5-flash-lite:google-ai-studio": {
    providerModelId: "gemini-2.5-flash-lite",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        audio: 0.0000003,
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
      rpm: 30_000,
      tpm: 30_000_000,
    },
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-2.5-flash-lite:vertex": {
    providerModelId: "gemini-2.5-flash-lite",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        audio: 0.0000003,
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
    ptbEnabled: false,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-2.5-flash-lite",
      },
    },
  },
  "gemini-2.5-flash-lite:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-2.5-flash-lite",
    pricing: [
      {
        threshold: 0,
        input: 0.00000011, // $0.11/1M - worst-case: $0.10/1M (Google) * 1.055
        output: 0.00000042, // $0.42/1M - worst-case: $0.40/1M (Google) * 1.055
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
      "tool_choice",
      "tools",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Gemini25FlashLiteModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
