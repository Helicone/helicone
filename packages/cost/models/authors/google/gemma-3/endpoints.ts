import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Gemma3ModelName } from "./model";

export const endpoints = {
  "gemma-3-12b-it:deepinfra": {
    providerModelId: "google/gemma-3-12b-it",
    provider: "deepinfra",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000001,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    quantization: "bf16",
    contextLength: 131_072,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
      "top_k",
      "seed",
      "min_p",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Gemma3ModelName}:${ModelProviderName}` | Gemma3ModelName,
    ModelProviderConfig
  >
>;
