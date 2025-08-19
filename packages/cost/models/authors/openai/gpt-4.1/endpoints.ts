import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT41ModelName } from "./models";

export const endpoints = {
  "gpt-4.1:openai": {
    providerModelId: "gpt-4.1",
    provider: "openai",
    pricing: {
      prompt: 0.000002,
      completion: 0.000008,
      cacheRead: 0.0000005,
    },
    contextLength: 1047576,
    maxCompletionTokens: 32768,
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
    pricing: {
      prompt: 0.00000025,
      completion: 0.000001,
      cacheRead: 0.0000001,
    },
    contextLength: 1047576,
    maxCompletionTokens: 32768,
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
    pricing: {
      prompt: 0.0000001,
      completion: 0.0000004,
      cacheRead: 0.00000005,
    },
    contextLength: 1047576,
    maxCompletionTokens: 32768,
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
  Record<`${GPT41ModelName}:${ProviderName}`, ModelProviderConfig>
>;
