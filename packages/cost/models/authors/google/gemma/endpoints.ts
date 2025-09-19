import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GemmaModelName } from "./model";

export const endpoints = {
  "gemma2-9b-it:groq": {
    providerModelId: "gemma2-9b-it",
    provider: "groq",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002,
        output: 0.0000002,
        image: 0.0,
      },
    ],
    contextLength: 8192,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "repetition_penalty",
      "seed",
      "stop",
      "temperature",
      "top_k",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gemma2-9b-it:openrouter": {
    provider: "openrouter",
    author: "google",
    providerModelId: "google/gemma-2-9b-it",
    pricing: [
      {
        threshold: 0,
        input: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (Groq) * 1.055
        output: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (Groq) * 1.055
      },
    ],
    contextLength: 8_192,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "repetition_penalty",
      "seed",
      "stop",
      "temperature",
      "top_k",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GemmaModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
