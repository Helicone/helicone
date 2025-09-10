import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { QwenModelName } from "./models";

export const endpoints = {
  "Qwen/Qwen3-32B:groq": {
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
} satisfies Partial<
  Record<`${QwenModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
