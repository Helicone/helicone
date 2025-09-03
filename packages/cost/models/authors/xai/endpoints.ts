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
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
        internal_reasoning: 0.0,
        cacheMultipliers: {
          cachedInput: 0.1, // $0.02 / $0.20 = 0.1
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
  "grok-4-0709:xai": {
    providerModelId: "grok-4-0709",
    provider: "xai",
    author: "xai",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens (up to 128K context)
        output: 0.000015, // $15.00 per 1M tokens (up to 128K context)
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        internal_reasoning: 0.0,
        cacheMultipliers: {
          cachedInput: 0.25, // $0.75 / $3.00 = 0.25
        },
      },
      {
        threshold: 128000, // Above 128K context window
        input: 0.000006, // $6.00 per 1M tokens (over 128K context)
        output: 0.00003, // $30.00 per 1M tokens (over 128K context)
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        internal_reasoning: 0.0,
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
        image: 0.0,
        audio: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        internal_reasoning: 0.0,
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
        image: 0.0,
        audio: 0.0,
        web_search: 0.025, // $25.00 per 1K sources
        internal_reasoning: 0.0,
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
} satisfies Partial<
  Record<`${GrokModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
