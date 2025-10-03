import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekV3ModelName } from "./model";

export const endpoints = {
  "deepseek-v3:deepseek": {
    provider: "deepseek",
    author: "deepseek",
    providerModelId: "deepseek-chat",
    pricing: [
      {
        threshold: 0,
        input: 0.00000056, // $0.56 per 1M tokens (cache miss)
        output: 0.00000168, // $1.68 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.125, // $0.07 per 1M tokens (cache hit) = $0.56 * 0.125
        },
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 8_192, // Maximum 8K (default 4K)
    supportedParameters: [
      "frequency_penalty",
      "function_call",
      "functions",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
      "seed",
      "stop",
      "stream",
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
  "deepseek-v3:deepinfra": {
    provider: "deepinfra",
    author: "deepseek",
    providerModelId: "deepseek-ai/DeepSeek-V3.1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000027, // $0.27 per 1M tokens
        output: 0.000001, // $1.00 per 1M tokens
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "tools",
      "tool_choice",
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
    quantization: "fp4",
    endpointConfigs: {
      "*": {},
    },
  },
  "deepseek-v3:openrouter": {
    provider: "openrouter",
    author: "deepseek",
    providerModelId: "deepseek/deepseek-chat-v3.1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000316, // $3.16/1M - worst-case: $3.00/1M (SambaNova) * 1.055
        output: 0.00000475, // $4.75/1M - worst-case: $4.50/1M (SambaNova) * 1.055
      },
    ],
    contextLength: 163_840,
    maxCompletionTokens: 163_840, // Same as context length when not specified
    supportedParameters: [
      "frequency_penalty",
      "function_call",
      "functions",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
      "seed",
      "stop",
      "stream",
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
  "deepseek-v3.1-terminus:deepinfra": {
    provider: "deepinfra",
    author: "deepseek",
    providerModelId: "deepseek-ai/DeepSeek-V3.1-Terminus",
    pricing: [
      {
        threshold: 0,
        input: 0.00000027,
        output: 0.000001,
        cacheMultipliers: {
          cachedInput: 0.8, // $0.216 per 1M tokens (cached) = $0.27 * 0.8
        },
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
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
  "deepseek-v3.2:novita": {
    provider: "novita",
    author: "deepseek",
    providerModelId: "deepseek/deepseek-v3.2-exp",
    pricing: [
      {
        threshold: 0,
        input: 0.00000027, // $0.27 per 1M tokens
        output: 0.00000041, // $0.41 per 1M tokens
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${DeepSeekV3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;

