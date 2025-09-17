import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralNemoModelName } from "./models";

export const endpoints = {
  "mistral-nemo:deepinfra": {
    providerModelId: "mistralai/Mistral-Nemo-Instruct-2407",
    provider: "deepinfra",
    author: "mistralai",
    pricing: [
      {
        threshold: 0,
        input: 0.02,
        output: 0.04,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    contextLength: 128_000,
    maxCompletionTokens: 16_400,
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
    ptbEnabled: false,
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
