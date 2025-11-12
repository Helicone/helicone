import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekR1ModelName } from "./models";

export const endpoints = {
  "deepseek-r1-distill-llama-70b:groq": {
    providerModelId: "deepseek-r1-distill-llama-70b",
    provider: "groq",
    author: "deepseek",
    pricing: [
      {
        threshold: 0,
        input: 0.00000075,
        output: 0.00000099,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 131_072,
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
      "seed",
      "stop",
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
  "deepseek-r1-distill-llama-70b:openrouter": {
    provider: "openrouter",
    author: "deepseek",
    providerModelId: "deepseek/deepseek-r1-distill-llama-70b",
    pricing: [
      {
        threshold: 0,
        input: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (Together) * 1.055
        output: 0.00000211, // $2.11/1M - worst-case: $2.00/1M (Together) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072, // Same as context length when not specified
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
    endpointConfigs: {
      "*": {},
    },
  },
  "deepseek-r1-distill-llama-70b:deepinfra": {
    provider: "deepinfra",
    author: "deepseek",
    providerModelId: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.60 per 1M tokens
        output: 0.0000012, // $1.20 per 1M tokens
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 16_384,
    quantization: "fp8",
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
} satisfies Partial<
  Record<`${DeepSeekR1ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
