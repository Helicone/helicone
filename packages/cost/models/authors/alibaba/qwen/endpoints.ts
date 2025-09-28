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
        input: 0.000000422, // $0.42/1M - worst-case: $0.40/1M (Cerebras/SambaNova) * 1.055
        output: 0.000000844, // $0.84/1M - worst-case: $0.80/1M (Cerebras/SambaNova) * 1.055
      },
    ],
    contextLength: 40_960,
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
    priority: 3,
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
  "qwen3-coder:deepinfra": {
    providerModelId: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    provider: "deepinfra",
    author: "qwen",
    pricing: [
      {
        threshold: 0,
        input: 0.00000029,
        output: 0.0000012,
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
    contextLength: 262_144,
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
      "response_format"
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "qwen3-next-80b-a3b-instruct:deepinfra": {
    providerModelId: "Qwen/Qwen3-Next-80B-A3B-Instruct",
    provider: "deepinfra",
    author: "qwen",
    pricing: [
      {
        threshold: 0,
        input: 0.00000014, // $0.14 per million tokens
        output: 0.0000014, // $1.40 per million tokens
      },
    ],
    rateLimits: {
      rpm: 12000, 
      tpm: 60000000,
      tpd: 6000000000,
    },
    contextLength: 262_000,
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
      "response_format"
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${QwenModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
