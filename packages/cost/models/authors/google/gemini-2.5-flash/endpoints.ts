import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini25FlashModelName } from "./model";

export const endpoints = {
  "gemini-2.5-flash:google-ai-studio": {
    providerModelId: "gemini-2.5-flash",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003,
        output: 0.0000025,
        audio: 0.000001,
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
      rpm: 10_000,
      tpm: 8_000_000,
    },
    ptbEnabled: true,
    responseFormat: "GOOGLE",
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-2.5-flash:vertex": {
    providerModelId: "gemini-2.5-flash",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.0000003,
        output: 0.0000025,
        audio: 0.000001,
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
    responseFormat: "GOOGLE",
    ptbEnabled: true,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-2.5-flash",
      },
    },
  },
  "gemini-2.5-flash:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-2.5-flash",
    pricing: [
      {
        threshold: 0,
        input: 0.00000032, // $0.32/1M - worst-case: $0.30/1M (Google) * 1.055
        output: 0.00000264, // $2.64/1M - worst-case: $2.50/1M (Google) * 1.055
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
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Gemini25FlashModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
