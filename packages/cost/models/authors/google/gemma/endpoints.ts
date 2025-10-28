import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GemmaModelName } from "./model";

export const endpoints = {
  "gemma2-9b-it:chutes": {
    providerModelId: "unsloth/gemma-2-9b-it",
    provider: "chutes",
    author: "google",
    pricing: [
      {
        threshold: 0,
        input: 0.00000001,
        output: 0.00000003,
      },
    ],
    contextLength: 8192,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "repetition_penalty",
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
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GemmaModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
