import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT41ModelName } from "./models";
export const endpoints = {
  "gpt-4.1:openai": {
    providerModelId: "gpt-4.1",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000002,
        output: 0.000008,
        cacheMultipliers: {
          read: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 10000,
      tpm: 30000000,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-mini:openai": {
    providerModelId: "gpt-4.1-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.000001,
        cacheMultipliers: {
          read: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-nano:openai": {
    providerModelId: "gpt-4.1-nano",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000004,
        cacheMultipliers: {
          read: 0.25,
        },
      },
    ],
    contextLength: 1047576,
    maxCompletionTokens: 32768,
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
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
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT41ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
