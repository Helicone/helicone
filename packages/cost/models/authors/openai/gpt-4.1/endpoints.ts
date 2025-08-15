import { ProviderName } from "@/cost/models/providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT41ModelName } from "./models";

export const endpoints = {
  "gpt-4.1:openai": {
    providerModelId: "gpt-4.1",
    provider: "openai",
    pricing: {
      prompt: 2,
      completion: 8,
      cacheRead: 0.5,
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
      prompt: 0.25,
      completion: 1,
      cacheRead: 0.1,
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
      prompt: 0.1,
      completion: 0.4,
      cacheRead: 0.05,
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
