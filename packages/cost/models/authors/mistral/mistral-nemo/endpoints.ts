import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralNemoModelName } from "./models";

export const endpoints = {
  "mistral-nemo:deepinfra": {
    providerModelId: "mistralai/Mistral-Nemo-Instruct-2407",
    provider: "deepinfra",
    author: "mistral",
    pricing: [
      {
        threshold: 0,
        input: 0.00002,
        output: 0.00004,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    quantization: "fp8",
    contextLength: 128_000,
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
    `${MistralNemoModelName}:${ModelProviderName}` | MistralNemoModelName,
    ModelProviderConfig
  >
>;
