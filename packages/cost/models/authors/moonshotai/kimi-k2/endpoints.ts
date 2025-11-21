import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { KimiK2ModelName } from "./models";

export const endpoints = {
  "kimi-k2-0905:groq": {
    providerModelId: "moonshotai/kimi-k2-instruct-0905",
    provider: "groq",
    author: "moonshotai",
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000003,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
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
  "kimi-k2-0905:deepinfra": {
    providerModelId: "moonshotai/Kimi-K2-Instruct-0905",
    provider: "deepinfra",
    author: "moonshotai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000005, // $0.50/1M tokens
        output: 0.000002, // $2.00/1M tokens
        cacheMultipliers: {
          cachedInput: 0.8, // $0.40/1M tokens (0.8x of input)
        },
      },
    ],
    quantization: "fp4",
    contextLength: 256_000,
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
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-0711:openrouter": {
    provider: "openrouter",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2",
    pricing: [
      {
        threshold: 0,
        input: 0.00000105, // $1.05/1M - worst-case: $1.00/1M (Together) * 1.055
        output: 0.00000316, // $3.16/1M - worst-case: $3.00/1M (Together) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
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
  "kimi-k2-0905:openrouter": {
    provider: "openrouter",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2-0905",
    pricing: [
      {
        threshold: 0,
        input: 0.00000142, // $1.42/1M - worst-case: $1.35/1M (WandB) * 1.055
        output: 0.00000528, // $5.28/1M - worst-case: $5.00/1M (Moonshot AI) * 1.055
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144, // Same as context when not specified
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
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
  "kimi-k2-0905:novita": {
    provider: "novita",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2-0905",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.6/1M
        output: 0.0000025, // $2.5/1M
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "structured_outputs",
      "functions",
      "tool_choice",
      "tools",
      "response_format",
      "max_tokens",
      "temperature",
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
  "kimi-k2-0905:baseten": {
    provider: "baseten",
    author: "moonshotai",
    providerModelId: "moonshotai/Kimi-K2-Instruct-0905",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.60/1M
        output: 0.0000025, // $2.50/1M
      },
    ],
    contextLength: 262_000,
    maxCompletionTokens: 163_800,
    quantization: "fp4",
    supportedParameters: [
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "stop",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-0905:fireworks": {
    provider: "fireworks",
    author: "moonshotai",
    providerModelId: "accounts/fireworks/models/kimi-k2-instruct-0905",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.60/1M
        output: 0.0000025, // $2.50/1M
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "top_k",
      "repetition_penalty",
      "logit_bias",
      "logprobs",
      "top_logprobs",
      "response_format",
      "structured_outputs",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-0711:novita": {
    provider: "novita",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2-instruct",
    pricing: [
      {
        threshold: 0,
        input: 0.00000057, // $0.57/1M
        output: 0.0000023, // $2.3/1M
      },
    ],
    quantization: "fp8",
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "repetition_penalty",
      "tools",
      "tool_choice",
      "response_format",
      "structured_outputs",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-thinking:novita": {
    provider: "novita",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2-thinking",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.6/1M
        output: 0.0000025, // $2.5/1M
      },
    ],
    quantization: "bf16",
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "tool_choice",
      "tools",
      "structured_outputs",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-thinking:deepinfra": {
    provider: "deepinfra",
    author: "moonshotai",
    providerModelId: "moonshotai/Kimi-K2-Thinking",
    pricing: [
      {
        threshold: 0,
        input: 0.00000055, // $0.55/1M
        output: 0.0000025, // $2.5/1M
      },
    ],
    quantization: "fp8",
    contextLength: 256_000,
    maxCompletionTokens: 8_000,
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
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2-thinking:fireworks": {
    provider: "fireworks",
    author: "moonshotai",
    providerModelId: "fireworks/kimi-k2-thinking",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.60/1M
        output: 0.0000025, // $2.5/1M
      },
    ],
    quantization: "int4",
    contextLength: 256_000,
    maxCompletionTokens: 4_096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "top_k",
      "repetition_penalty",
      "logit_bias",
      "logprobs",
      "top_logprobs",
      "response_format",
      "structured_outputs",
      "tool_choice",
      "tools",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${KimiK2ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
