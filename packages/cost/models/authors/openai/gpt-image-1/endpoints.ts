import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GptImage1ModelName } from "./models";

export const endpoints = {
  "gpt-image-1:openai": {
    providerModelId: "gpt-image-1",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 per 1M text input tokens
        output: 0.00004, // $40 per 1M image output tokens
        image: 0.00001, // $10 per 1M image input tokens
      },
    ],
    rateLimits: {
      rpm: 500,
      tpm: 1000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "seed",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-image-1:azure": {
    providerModelId: "gpt-image-1",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 per 1M text input tokens
        output: 0.00004, // $40 per 1M image output tokens
        image: 0.00001, // $10 per 1M image input tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 300,
      tpm: 500000,
    },
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "seed",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-image-1:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-image-1",
    pricing: [
      {
        threshold: 0,
        input: 0.0000053, // $5.28/1M - worst-case: $5.00/1M (OpenAI) * 1.055
        output: 0.0000422, // $42.20/1M - worst-case: $40.00/1M (OpenAI) * 1.055
        image: 0.0000106, // $10.55/1M - worst-case: $10.00/1M (OpenAI) * 1.055
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "seed",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GptImage1ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
