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
    quantization: "fp4",
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
  "deepseek-reasoner:openrouter": {
    provider: "openrouter",
    author: "deepseek",
    providerModelId: "deepseek/deepseek-r1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000316, // $3.16/1M - worst-case: $3.00/1M (Fireworks) * 1.055
        output: 0.00000844, // $8.44/1M - worst-case: $8.00/1M (Fireworks) * 1.055
      },
    ],
    contextLength: 163_840, // OpenRouter's context for deepseek-r1
    maxCompletionTokens: 163_840,
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
  "deepseek-reasoner:deepinfra": {
    provider: "deepinfra",
    author: "deepseek",
    providerModelId: "deepseek-ai/DeepSeek-R1-0528",
    pricing: [
      {
        threshold: 0,
        input: 0.0000005, // $0.50 per 1M tokens
        output: 0.00000215, // $2.15 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.8, // $0.40 per 1M tokens (cached)
        },
      },
    ],
    rateLimits: {
      rpm: 12000,
      tpm: 60000000,
      tpd: 6000000000,
    },
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
  "deepseek-tng-r1t2-chimera:chutes": {
    provider: "chutes",
    author: "deepseek",
    providerModelId: "tngtech/DeepSeek-TNG-R1T2-Chimera",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30 per 1M tokens
        output: 0.0000012 // $1.20 per 1M tokens
      },
    ],
    contextLength: 130_000,
    maxCompletionTokens: 163_840,
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
      "logprobs",
      "logit_bias",
      "top_logprobs",
      "functions",
      "tools"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  // io.net Intelligence endpoints
  "deepseek-reasoner:io-intelligence": {
    provider: "io-intelligence",
    author: "deepseek",
    providerModelId: "deepseek-ai/DeepSeek-R1-0528",
    pricing: [
      {
        threshold: 0,
        input: 0.0000004, // $0.40 per 1M tokens
        output: 0.00000175, // $1.75 per 1M tokens
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
    ptbEnabled: false,
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
