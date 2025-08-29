import { ProviderName } from "../../../providers";
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
          read: 0.25,
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
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-2.5-flash-lite:vertex": {
    providerModelId: "gemini-2.5-flash-lite",
    provider: "vertex",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        audio: 0.0000003,
        cacheMultipliers: {
          read: 0.25,
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
    ptbEnabled: true,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-2.5-flash-lite",
      },
    },
  },
} satisfies Partial<
  Record<`${Gemini25FlashLiteModelName}:${ProviderName}`, ModelProviderConfig>
>;
