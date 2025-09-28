import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini25ProModelName } from "./model";

export const endpoints = {
  "gemini-2.5-pro:google-ai-studio": {
    providerModelId: "gemini-2.5-pro",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        image: 0.00516,
        cacheMultipliers: {
          cachedInput: 0.25,
          write5m: 1.0,
        },
        cacheStoragePerHour: 0.0000045,
      },
      {
        threshold: 200000,
        input: 0.0000025,
        output: 0.000015,
        image: 0.00516,
      },
    ],
    contextLength: 1048576,
    maxCompletionTokens: 65536,
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
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-2.5-pro:vertex": {
    providerModelId: "gemini-2.5-pro",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        image: 0.00516,
        cacheMultipliers: {
          cachedInput: 0.25,
          write5m: 1.0,
        },
        cacheStoragePerHour: 0.0000045,
      },
      {
        threshold: 200000,
        input: 0.0000025,
        output: 0.000015,
        image: 0.00516,
      },
    ],
    contextLength: 1048576,
    maxCompletionTokens: 65536,
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
      global: {
        providerModelId: "gemini-2.5-pro",
      },
    },
  },
  "gemini-2.5-pro:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-2.5-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.00000264, // $2.64/1M - worst-case: $2.50/1M (Google >200K) * 1.055
        output: 0.00001582, // $15.82/1M - worst-case: $15.00/1M (Google >200K) * 1.055
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
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Gemini25ProModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
