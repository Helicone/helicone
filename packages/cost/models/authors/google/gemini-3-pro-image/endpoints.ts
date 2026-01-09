import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemini3ProImagePreviewModelName } from "./model";

export const endpoints = {
  "gemini-3-pro-image-preview:google-ai-studio": {
    providerModelId: "gemini-3-pro-image-preview",
    provider: "google-ai-studio",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2/1M tokens (same as Gemini 3 Pro)
        output: 0.000012, // $12/1M tokens (same as Gemini 3 Pro)
        image: {
          output: 0.00012, // $120/1M tokens for image output ($0.134 per 1K/2K image)
        },
      },
      {
        threshold: 200000,
        input: 0.000004, // $4/1M tokens (over 200K context)
        output: 0.000018, // $18/1M tokens (over 200K context)
        image: {
          output: 0.00012, // $120/1M tokens for image output
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
      rpm: 100, // Preview model has more restrictive limits
      tpm: 1_000_000,
    },
    ptbEnabled: true,
    responseFormat: "GOOGLE",
    endpointConfigs: {
      "*": {},
    },
  },
  "gemini-3-pro-image-preview:vertex": {
    providerModelId: "gemini-3-pro-image-preview",
    provider: "vertex",
    author: "google",
    crossRegion: true,
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2/1M tokens
        output: 0.000012, // $12/1M tokens
        image: {
          output: 0.00012, // $120/1M tokens for image output ($0.134 per 1K/2K image)
        },
      },
      {
        threshold: 200000,
        input: 0.000004, // $4/1M tokens (over 200K context)
        output: 0.000018, // $18/1M tokens (over 200K context)
        image: {
          output: 0.00012, // $120/1M tokens for image output
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
        providerModelId: "gemini-3-pro-image-preview",
      },
    },
  },
  "gemini-3-pro-image-preview:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemini-3-pro-image-preview",
    pricing: [
      {
        threshold: 0,
        input: 0.00000211, // $2.11/1M - $2.00/1M * 1.055
        output: 0.00001266, // $12.66/1M - $12.00/1M * 1.055
        image: {
          output: 0.0001266, // $126.60/1M - $120/1M * 1.055 for image output
        },
      },
      {
        threshold: 200000,
        input: 0.00000422, // $4.22/1M - $4.00/1M * 1.055 (over 200K context)
        output: 0.00001899, // $18.99/1M - $18.00/1M * 1.055 (over 200K context)
        image: {
          output: 0.0001266, // $126.60/1M - $120/1M * 1.055 for image output
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
    `${Gemini3ProImagePreviewModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
