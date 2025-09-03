import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT4oModelName } from "./models";
export const endpoints = {
  "gpt-4o:openai": {
    providerModelId: "gpt-4o",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 15000000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4o:azure": {
    providerModelId: "gpt-4o",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 300,
      tpm: 50000,
    },
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4o-mini:openai": {
    providerModelId: "gpt-4o-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4o-mini:azure": {
    providerModelId: "gpt-4o-mini",
    provider: "azure",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 2000,
      tpm: 200000,
    },
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "chatgpt-4o-latest:openai": {
    providerModelId: "chatgpt-4o-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.00002,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
      tpd: 15000000000,
    },
    contextLength: 128000,
    maxCompletionTokens: 16384,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT4oModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
