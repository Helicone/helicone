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
      },
    ],
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
  "gpt-4o:azure-openai": {
    providerModelId: "gpt-4o",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
      },
    ],
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
  "gpt-4o:extended:openai": {
    providerModelId: "gpt-4o-2024-08-06",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 64000,
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
      },
    ],
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
  "gpt-4o-mini:azure-openai": {
    providerModelId: "gpt-4o-mini",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
      },
    ],
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
  "chatgpt-4o-latest:openai": {
    providerModelId: "chatgpt-4o-latest",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.00002,
      },
    ],
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
  "gpt-4o-mini-search-preview:openai": {
    providerModelId: "gpt-4o-mini-search-preview",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000015,
        output: 0.0000006,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: ["max_tokens", "response_format"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4o-search-preview:openai": {
    providerModelId: "gpt-4o-search-preview",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000025,
        output: 0.00001,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: ["max_tokens", "response_format"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPT4oModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
