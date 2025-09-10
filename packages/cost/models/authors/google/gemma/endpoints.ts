import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GemmaModelName } from "./model";

export const endpoints = {
  "google/gemma-2-9b:groq": {
    providerModelId: "google/gemma-2-9b",
    provider: "groq",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002,
        output: 0.0000002,
        image: 0.0,
      }
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
      "top_p"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GemmaModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
