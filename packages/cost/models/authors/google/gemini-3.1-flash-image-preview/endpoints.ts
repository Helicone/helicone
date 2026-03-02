import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini31FlashImagePreviewModelName } from "./model";

export const endpoints = {
  "gemini-3.1-flash-image-preview:google-ai-studio": {
    providerModelId: "gemini-3.1-flash-image-preview",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25/1M tokens
        output: 0.0000015, // $1.50/1M tokens (text output)
        image: {
          input: 0.00000025, // $0.25/1M tokens for image input (same as text)
          output: 0.00006, // $60/1M tokens for image output ($0.067 per 1K image)
        },
      },
    ],
    contextLength: 65_536,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    rateLimits: {
      rpm: 100,
      tpm: 1_000_000,
    },
    ptbEnabled: true,
    responseFormat: "GOOGLE",
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-3.1-flash-image-preview:vertex": {
    providerModelId: "gemini-3.1-flash-image-preview",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25/1M tokens
        output: 0.0000015, // $1.50/1M tokens (text output)
        image: {
          input: 0.00000025, // $0.25/1M tokens for image input (same as text)
          output: 0.00006, // $60/1M tokens for image output
        },
      },
    ],
    contextLength: 65_536,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    responseFormat: "GOOGLE",
    ptbEnabled: true,
    endpointConfigs: {
      global: {
        providerModelId: "gemini-3.1-flash-image-preview",
      },
    },
  },
  "gemini-3.1-flash-image-preview:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-3.1-flash-image-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.000000264, // $0.264/1M - $0.25/1M * 1.055 (OpenRouter 5.5% markup)
        output: 0.000001583, // $1.583/1M - $1.50/1M * 1.055
        image: {
          input: 0.000000264, // $0.264/1M for image input (with markup)
          output: 0.0000633, // $63.30/1M - $60/1M * 1.055 for image output
        },
      },
    ],
    contextLength: 65_536,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "max_tokens",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Gemini31FlashImagePreviewModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
