import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT55ModelName } from "./models";

export const endpoints = {
  "gpt-5.5:starveri": {
    providerModelId: "gpt-5.5",
    provider: "starveri",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000008333333333334, // $0.83 per 1M tokens
        output: 0.0000025, // $2.50 per 1M tokens
        web_search: 0.0033333333333333335,
        cacheMultipliers: {
          cachedInput: 0.1, // $0.083 per 1M tokens
        },
      },
    ],
    contextLength: 1_050_000,
    maxCompletionTokens: 128_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
      "verbosity",
      "temperature",
      "top_p",
      "logprobs",
    ],
    unsupportedParameters: [
      "presence_penalty",
      "frequency_penalty",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT55ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
