import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralSmallModelName } from "./models";

export const endpoints = {
  "mistral-small:deepinfra": {
    providerModelId: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    provider: "deepinfra",
    author: "mistralai",
    pricing: [
      {
        threshold: 0,
        input: 0.05,
        output: 0.1,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
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
    quantization: "fp8",
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${MistralSmallModelName}:${ModelProviderName}` | MistralSmallModelName,
    ModelProviderConfig
  >
>;
