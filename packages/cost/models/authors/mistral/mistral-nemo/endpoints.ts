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
  "mistral-nemo:flexai": {
    providerModelId: "Mistral-Nemo-Instruct-2407-FP8",
    provider: "flexai",
    author: "mistral",
    pricing: [
      {
        threshold: 0,
        input: 0.000000019, // $0.019 per million tokens
        output: 0.00000003, // $0.03 per million tokens
        cacheMultipliers: {
          cachedInput: 0.15,
        },
      },
    ],
    quantization: "fp8",
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "min_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
      "seed",
      "logit_bias",
      "logprobs",
      "top_logprobs",
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
