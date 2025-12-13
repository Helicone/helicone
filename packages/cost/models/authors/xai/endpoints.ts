import { ModelProviderName } from "../../providers";
import type { ModelProviderConfig } from "../../types";
import { GrokModelName } from "./models";

export const endpoints = {
  "grok-code-fast-1:xai": {
    providerModelId: "grok-code-fast-1",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000015, // $1.50 per 1M tokens
        request: 0.0,
        web_search: 0.0,
        cacheMultipliers: {
          cachedInput: 0.1, // $0.02 / $0.20 = 0.1
        },
      },
    ],
    contextLength: 256000,
    maxCompletionTokens: 10000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-4:xai": {
    providerModelId: "grok-4",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens (up to 128K context)
        output: 0.000015, // $15.00 per 1M tokens (up to 128K context)
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.75 / $3.00 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.000006, // $6.00 per 1M tokens (over 128K context)
        output: 0.00003, // $30.00 per 1M tokens (over 128K context)
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.75 / $6.00 = 0.125
        },
      },
    ],
    contextLength: 256000,
    maxCompletionTokens: 256000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-4-fast-reasoning:xai": {
    providerModelId: "grok-4-fast",
    provider: "xai",
    author: "xai",
    providerModelIdAliases: ["grok-4-fast-reasoning"],
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens (up to 128K context)
        output: 0.0000005, // $0.50 per 1M tokens (up to 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.0000004, // $0.40 per 1M tokens (over 128K context)
        output: 0.000001, // $1.00 per 1M tokens (over 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.05 / $0.40 = 0.125
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-fast-non-reasoning:xai": {
    providerModelId: "grok-4-fast-non-reasoning",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "response_format",
      "tools",
      "tool_choice",
      "structured_outputs",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-1-fast-non-reasoning:xai": {
    providerModelId: "grok-4-1-fast-non-reasoning",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "response_format",
      "tools",
      "tool_choice",
      "structured_outputs",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-1-fast-reasoning:xai": {
    providerModelId: "grok-4-1-fast-reasoning",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens (up to 128K context)
        output: 0.0000005, // $0.50 per 1M tokens (up to 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.0000004, // $0.40 per 1M tokens (over 128K context)
        output: 0.000001, // $1.00 per 1M tokens (over 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.05 / $0.40 = 0.125
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-3:xai": {
    providerModelId: "grok-3",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.75 / $3.00 = 0.25
        },
      },
    ],
    contextLength: 131072,
    maxCompletionTokens: 131072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-3-mini:xai": {
    providerModelId: "grok-3-mini",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.075 / $0.30 = 0.25
        },
      },
    ],
    contextLength: 131072,
    maxCompletionTokens: 131072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-3-mini:openrouter": {
    provider: "openrouter",
    author: "xai",
    providerModelId: "x-ai/grok-3-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.000000633, // $0.63/1M - worst-case: $0.60/1M (xAI) * 1.055
        output: 0.00000422, // $4.22/1M - worst-case: $4.00/1M (xAI) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-4:helicone": {
    providerModelId: "pa/grk-4",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens (up to 128K context)
        output: 0.000015, // $15.00 per 1M tokens (up to 128K context)
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.75 / $3.00 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.000006, // $6.00 per 1M tokens (over 128K context)
        output: 0.00003, // $30.00 per 1M tokens (over 128K context)
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.75 / $6.00 = 0.125
        },
      },
    ],
    contextLength: 256000,
    maxCompletionTokens: 256000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-4-fast-reasoning:helicone": {
    providerModelId: "pa/grok-4-fast-reasoning",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens (up to 128K context)
        output: 0.0000005, // $0.50 per 1M tokens (up to 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.0000004, // $0.40 per 1M tokens (over 128K context)
        output: 0.000001, // $1.00 per 1M tokens (over 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.05 / $0.40 = 0.125
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-fast-non-reasoning:helicone": {
    providerModelId: "pa/grok-4-fast-non-reasoning",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "response_format",
      "tools",
      "tool_choice",
      "structured_outputs",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-1-fast-non-reasoning:helicone": {
    providerModelId: "pa/grok-4-1-fast-non-reasoning",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "response_format",
      "tools",
      "tool_choice",
      "structured_outputs",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-4-1-fast-reasoning:helicone": {
    providerModelId: "pa/grok-4-1-fast-reasoning",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens (up to 128K context)
        output: 0.0000005, // $0.50 per 1M tokens (up to 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.05 / $0.20 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.0000004, // $0.40 per 1M tokens (over 128K context)
        output: 0.000001, // $1.00 per 1M tokens (over 128K context)
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.125, // $0.05 / $0.40 = 0.125
        },
      },
    ],
    contextLength: 2_000_000,
    maxCompletionTokens: 2_000_000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "seed",
      "logprobs",
      "top_logprobs",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "grok-code-fast-1:helicone": {
    providerModelId: "pa/grok-code-fast-1",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000002, // $0.20 per 1M tokens
        output: 0.0000015, // $1.50 per 1M tokens
        request: 0.0,
        web_search: 0.0,
        cacheMultipliers: {
          cachedInput: 0.1, // $0.02 / $0.20 = 0.1
        },
      },
    ],
    contextLength: 256000,
    maxCompletionTokens: 10000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-3:helicone": {
    providerModelId: "pa/grk-3",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.75 / $3.00 = 0.25
        },
      },
    ],
    contextLength: 131072,
    maxCompletionTokens: 131072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-3-mini:helicone": {
    providerModelId: "pa/grok-3-mini",
    provider: "helicone",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003, // $0.30 per 1M tokens
        output: 0.0000005, // $0.50 per 1M tokens
        request: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        cacheMultipliers: {
          cachedInput: 0.25, // $0.075 / $0.30 = 0.25
        },
      },
    ],
    contextLength: 131072,
    maxCompletionTokens: 131072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-3:openrouter": {
    provider: "openrouter",
    author: "xai",
    providerModelId: "x-ai/grok-3",
    pricing: [
      {
        threshold: 0,
        input: 0.00000528, // $5.28/1M - worst-case: $5.00/1M (xAI) * 1.055
        output: 0.00002638, // $26.38/1M - worst-case: $25.00/1M (xAI) * 1.055
      },
    ],
    contextLength: 131_072,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-4:openrouter": {
    provider: "openrouter",
    author: "xai",
    providerModelId: "x-ai/grok-4",
    pricing: [
      {
        threshold: 0,
        input: 0.00000633, // $6.33/1M - worst-case: $6.00/1M (xAI >128K) * 1.055
        output: 0.00003165, // $31.65/1M - worst-case: $30.00/1M (xAI >128K) * 1.055
      },
    ],
    contextLength: 256_000,
    maxCompletionTokens: 256_000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
  "grok-code-fast-1:openrouter": {
    provider: "openrouter",
    author: "xai",
    providerModelId: "x-ai/grok-code-fast-1",
    pricing: [
      {
        threshold: 0,
        input: 0.00000021, // $0.21/1M - worst-case: $0.20/1M (xAI) * 1.055
        output: 0.00000158, // $1.58/1M - worst-case: $1.50/1M (xAI) * 1.055
      },
    ],
    contextLength: 256_000,
    maxCompletionTokens: 10_000,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
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
} satisfies Partial<
  Record<`${GrokModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
