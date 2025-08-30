import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O3ModelName } from "./models";
export const endpoints = {
  "o3:openai": {
    providerModelId: "o3-2025-04-16",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000002,
        output: 0.000008,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3:azure-openai": {
    providerModelId: "o3",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000002,
        output: 0.000008,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-pro:openai": {
    providerModelId: "o3-pro-2025-06-10",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00002,
        output: 0.00008,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-pro:azure-openai": {
    providerModelId: "o3-pro",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00002,
        output: 0.00008,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:openai": {
    providerModelId: "o3-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:azure-openai": {
    providerModelId: "o3-mini",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini-high:openai": {
    providerModelId: "o3-mini-high",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
