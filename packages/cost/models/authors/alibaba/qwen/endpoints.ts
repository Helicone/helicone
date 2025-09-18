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
  "qwen3-30b-a3b:deepinfra": {
    providerModelId: "Qwen/Qwen3-30B-A3B",
    provider: "deepinfra",
    author: "qwen",
    pricing: [
      {
        threshold: 0,
        input: 0.00000008,
        output: 0.00000029,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    contextLength: 32_768,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
      "top_k",
      "min_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${QwenModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
