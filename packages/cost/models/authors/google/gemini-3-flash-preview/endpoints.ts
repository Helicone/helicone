import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini3FlashPreviewModelName } from "./model";

export const endpoints = {
  "gemini-3-flash-preview:google-ai-studio": {
    providerModelId: "gemini-3-flash-preview",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000005, // $0.50/1M tokens
        output: 0.000003, // $3/1M tokens
        cacheMultipliers: {
          cachedInput: 0.1, // $0.05/1M = 10% of input
        },
        audio: {
          input: 0.000001, // $1/1M audio tokens
          cachedInputMultiplier: 0.1, // $0.10/1M = 10% of audio input
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
  "gemini-3-flash-preview:vertex": {
    providerModelId: "gemini-3-flash-preview",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.0000005, // $0.50/1M tokens
        output: 0.000003, // $3/1M tokens
        cacheMultipliers: {
          cachedInput: 0.1, // $0.05/1M = 10% of input
        },
        audio: {
          input: 0.000001, // $1/1M audio tokens
          cachedInputMultiplier: 0.1, // $0.10/1M = 10% of audio input
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
        providerModelId: "gemini-3-flash-preview",
      },
    },
  },
  "gemini-3-flash-preview:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-3-flash-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.00000052775, // $0.52775/1M - $0.50/1M * 1.055
        output: 0.000003165, // $3.165/1M - $3.00/1M * 1.055
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
} satisfies Partial<
  Record<`${Gemini3FlashPreviewModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
