import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT5ModelName } from "./models";

export const endpoints = {
  "gpt-5:openai": {
    providerModelId: "gpt-5",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        cacheMultipliers: {
          read: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 15000,
      tpm: 40000000,
      tpd: 15000000000,
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
      "verbosity",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-mini:openai": {
    providerModelId: "gpt-5-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000002,
        cacheMultipliers: {
          read: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 30000,
      tpm: 180000000,
      tpd: 15000000000,
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
      "verbosity",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-nano:openai": {
    providerModelId: "gpt-5-nano",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000005,
        output: 0.0000004,
        cacheMultipliers: {
          read: 0.1,
        },
      },
    ],
    contextLength: 400000,
    maxCompletionTokens: 128000,
    rateLimits: {
      rpm: 30000,
      tpm: 180000000,
      tpd: 15000000000,
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
      "verbosity",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-chat-latest:openai": {
    providerModelId: "gpt-5-chat-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000125,
        output: 0.00001,
        cacheMultipliers: {
          read: 0.1,
        },
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    rateLimits: {
      rpm: 15000,
      tpm: 40000000,
      tpd: 15000000000,
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
      "verbosity",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT5ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
