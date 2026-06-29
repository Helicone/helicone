import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT53CodexModelName } from "./models";

export const endpoints = {
  "gpt-5.3-codex:starveri": {
    providerModelId: "gpt-5.3-codex",
    provider: "starveri",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000016666666666666, // $0.167 per 1M tokens
        output: 0.0000003333333333333, // $0.33 per 1M tokens
        web_search: 0.0033333333333333335,
        cacheMultipliers: {
          cachedInput: 0.1, // $0.0167 per 1M tokens
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5.3-codex-spark:starveri": {
    providerModelId: "gpt-5.3-codex-spark",
    provider: "starveri",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003333333333333, // $0.33 per 1M tokens
        output: 0.0000006666666666666, // $0.67 per 1M tokens
        web_search: 0.0033333333333333335,
        cacheMultipliers: {
          cachedInput: 0.01, // $0.0033 per 1M tokens
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_completion_tokens",
      "response_format",
      "stop",
    ],
    unsupportedParameters: [
      "temperature",
      "top_p",
      "presence_penalty",
      "frequency_penalty",
      "logprobs",
      "top_logprobs",
      "logit_bias",
      "max_tokens",
      "verbosity",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT53CodexModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
