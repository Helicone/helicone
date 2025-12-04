import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPTOSSModelName } from "./models";
export const endpoints = {
  "gpt-oss-120b:groq": {
    providerModelId: "openai/gpt-oss-120b",
    provider: "groq",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.00000075,
        request: 0.0,
        audio: 0.0,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "frequency_penalty",
      "include_reasoning",
      "logit_bias",
      "logprobs",
      "max_completion_tokens",
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
  "gpt-oss-20b:groq": {
    providerModelId: "openai/gpt-oss-20b",
    provider: "groq",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000005,
        request: 0.0,
        audio: 0.0,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "frequency_penalty",
      "include_reasoning",
      "logit_bias",
      "logprobs",
      "max_completion_tokens",
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
  "gpt-oss-20b:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-oss-20b",
    pricing: [
      {
        threshold: 0,
        input: 0.00000011, // $0.11/1M - worst-case: $0.10/1M (Hyperbolic) * 1.055
        output: 0.00000053, // $0.53/1M - worst-case: $0.50/1M (Groq) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_000,
    maxCompletionTokens: 131_000,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
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
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-oss-20b:novita": {
    provider: "novita",
    author: "openai",
    providerModelId: "openai/gpt-oss-20b",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005, // $0.05/1M
        output: 0.0000002, // $0.2/1M
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 32_768,
    quantization: "bf16",
    supportedParameters: [
      "structured_outputs",
      "reasoning",
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
  "gpt-oss-120b:openrouter": {
    provider: "openrouter",
    author: "openai",
    providerModelId: "openai/gpt-oss-120b",
    pricing: [
      {
        threshold: 0,
        input: 0.00000037, // $0.37/1M - worst-case: $0.35/1M (Cerebras) * 1.055
        output: 0.00000079, // $0.79/1M - worst-case: $0.75/1M (Groq) * 1.055
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072, // Not specified, using context length
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
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
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-oss-120b:deepinfra": {
    providerModelId: "openai/gpt-oss-120b",
    provider: "deepinfra",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000004,
        output: 0.00000016,
        request: 0.0,
        audio: 0.0,
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
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
  "gpt-oss-120b:cerebras": {
    providerModelId: "gpt-oss-120b",
    provider: "cerebras",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000035, // $0.35/1M tokens
        output: 0.00000075, // $0.75/1M tokens
      },
    ],
    contextLength: 131_072, // Paid tiers: 131k tokens, Free tier: 65k tokens
    maxCompletionTokens: 40_000, // Paid tiers: 40k tokens, Free tier: 32k tokens
    supportedParameters: [
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "seed",
      "logprobs",
      "top_logprobs",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-oss-120b:baseten": {
    providerModelId: "openai/gpt-oss-120b",
    provider: "baseten",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001, // $0.10/1M tokens
        output: 0.0000005, // $0.50/1M tokens
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPTOSSModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
