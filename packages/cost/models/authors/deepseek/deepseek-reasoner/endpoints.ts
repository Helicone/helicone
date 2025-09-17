import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekReasonerModelName } from "./model";

export const endpoints = {
  "deepseek-reasoner:deepseek": {
    provider: "deepseek",
    author: "deepseek",
    providerModelId: "deepseek-reasoner",
    pricing: [
      {
        threshold: 0,
        input: 0.00000056, // $0.56 per 1M tokens (cache miss)
        output: 0.00000168, // $1.68 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.125,
        },
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 64_000,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
      "seed",
      "stop",
      "stream",
      "temperature",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${DeepSeekReasonerModelName}:${ModelProviderName}`,
    ModelProviderConfig
  >
>;
