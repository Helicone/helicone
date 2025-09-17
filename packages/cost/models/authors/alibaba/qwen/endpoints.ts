import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { QwenModelName } from "./models";

export const endpoints = {
  "qwen3-32b:groq": {
    providerModelId: "Qwen/Qwen3-32B",
    provider: "groq",
    author: "alibaba",
    pricing: [
      {
        threshold: 0,
        input: 0.00000029,
        output: 0.00000059,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 40_960,
    supportedParameters: [
      "frequency_penalty",
      "include_reasoning",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "reasoning",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  // OpenRouter fallback endpoint with 5.5% markup
  "qwen3-32b:openrouter": {
    providerModelId: "qwen/qwen3-32b",
    provider: "openrouter",
    author: "alibaba",
    pricing: [
      {
        threshold: 0,
        input: 0.0000000316, // $0.00000003 * 1.055 = $0.0000000316 (OpenRouter: $0.03/1M + 5.5% markup)
        output: 0.0000001371, // $0.00000013 * 1.055 = $0.0000001371 (OpenRouter: $0.13/1M + 5.5% markup)
      },
    ],
    contextLength: 40960,
    maxCompletionTokens: 40_960,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "seed",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3, // Fallback priority
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${QwenModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
