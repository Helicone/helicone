import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { LlamaModelName } from "./models";

export const endpoints = {
  "llama-4-scout:groq": {
    providerModelId: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000011,
        output: 0.00000034,
        request: 0.0,
        image: 0.00036762,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "max_tokens",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-4-maverick:groq": {
    providerModelId: "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002,
        output: 0.0000006,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "max_tokens",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-guard-4:groq": {
    providerModelId: "meta-llama/Llama-Guard-4-12B",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002,
        output: 0.0000006,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 1_024,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.3-70b-instruct:groq": {
    providerModelId: "llama-3.3-70b-versatile",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000059,
        output: 0.00000079,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 32_678,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "repetition_penalty",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.1-8b-instant:groq": {
    providerModelId: "llama-3.1-8b-instant",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.00000008,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "repetition_penalty",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-prompt-guard-2-86m:groq": {
    providerModelId: "meta-llama/llama-prompt-guard-2-86m",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000001,
        output: 0.00000001,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 512,
    maxCompletionTokens: 2,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-prompt-guard-2-22m:groq": {
    providerModelId: "meta-llama/llama-prompt-guard-2-22m",
    provider: "groq",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000001,
        output: 0.00000001,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
      },
    ],
    contextLength: 512,
    maxCompletionTokens: 2,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-4-scout:openrouter": {
    provider: "openrouter",
    author: "meta-llama",
    providerModelId: "meta-llama/llama-4-scout",
    pricing: [
      {
        threshold: 0,
        input: 0.00000069, // $0.69/1M - worst-case: $0.65/1M (Cerebras) * 1.055
        output: 0.0000009, // $0.90/1M - worst-case: $0.85/1M (Cerebras) * 1.055
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 1_048_576,
    supportedParameters: [
      "max_tokens",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-4-maverick:openrouter": {
    provider: "openrouter",
    author: "meta-llama",
    providerModelId: "meta-llama/llama-4-maverick",
    pricing: [
      {
        threshold: 0,
        input: 0.00000066, // $0.66/1M - worst-case: $0.63/1M (SambaNova) * 1.055
        output: 0.0000019, // $1.90/1M - worst-case: $1.80/1M (SambaNova) * 1.055
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "max_tokens",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-guard-4:openrouter": {
    provider: "openrouter",
    author: "meta-llama",
    providerModelId: "meta-llama/llama-guard-4-12b",
    pricing: [
      {
        threshold: 0,
        input: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (Together) * 1.055
        output: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (Together) * 1.055
      },
    ],
    contextLength: 163_840,
    maxCompletionTokens: 163_840,
    supportedParameters: [
      "frequency_penalty",
      "max_tokens",
      "presence_penalty",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "top_k",
      "top_p",
    ],
    ptbEnabled: true,
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.3-70b-instruct:openrouter": {
    provider: "openrouter",
    author: "meta-llama",
    providerModelId: "meta-llama/llama-3.3-70b-instruct",
    pricing: [
      {
        threshold: 0,
        input: 0.00000095, // $0.95/1M - worst-case: $0.90/1M (Fireworks) * 1.055
        output: 0.00000237, // $2.37/1M - worst-case: $2.25/1M (Cloudflare) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "frequency_penalty",
      "max_tokens",
      "presence_penalty",
      "repetition_penalty",
      "response_format",
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
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.1-8b-instant:openrouter": {
    provider: "openrouter",
    author: "meta-llama",
    providerModelId: "meta-llama/llama-3.1-8b-instruct",
    pricing: [
      {
        threshold: 0,
        input: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (Fireworks) * 1.055
        output: 0.00000031, // $0.31/1M - worst-case: $0.29/1M (Cloudflare) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "frequency_penalty",
      "max_tokens",
      "presence_penalty",
      "repetition_penalty",
      "response_format",
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
    priority: 3,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.1-8b-instruct-turbo:deepinfra": {
    providerModelId: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    provider: "deepinfra",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000002, // $0.02/1M tokens
        output: 0.00000003, // $0.03/1M tokens
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 128_000,
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
      "tool_choice",
      "tools",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "llama-3.1-8b-instruct:novita": {
    providerModelId: "meta-llama/llama-3.1-8b-instruct",
    provider: "novita",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00000002,
        output: 0.00000005,
      },
    ],
    quantization: "fp8",
    contextLength: 16_384,
    maxCompletionTokens: 16_384,
    supportedParameters: [
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
      "logit_bias"
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {}
    },
  },
  "llama-3.1-8b-instruct:deepinfra": {
    providerModelId: "meta-llama/Meta-Llama-3-8B-Instruct",
    provider: "deepinfra",
    author: "meta-llama",
    pricing: [
      {
        threshold: 0,
        input: 0.00003, // $0.03 per 1M tokens - DeepInfra pricing from https://deepinfra.com/meta-llama/Meta-Llama-3-8B-Instruct
        output: 0.00006, // $0.06 per 1M tokens - DeepInfra pricing from https://deepinfra.com/meta-llama/Meta-Llama-3-8B-Instruct
      },
    ],
    contextLength: 8_000,
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
      "tool_choice",
      "tools",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${LlamaModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
