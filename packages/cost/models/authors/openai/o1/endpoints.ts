import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O1ModelName } from "./models";
export const endpoints = {
  "o1:openai": {
    provider: "openai",
    author: "openai",
    providerModelId: "o1",
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.00006,
        image: 0.000000021675,
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
  "o1:azure-openai": {
    provider: "azure-openai",
    author: "openai",
    providerModelId: "o1",
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.00006,
        image: 0.000000021675,
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
  "o1-pro:openai": {
    provider: "openai",
    author: "openai",
    providerModelId: "o1-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.000015,
        output: 0.00006,
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
  "o1-mini:openai": {
    provider: "openai",
    author: "openai",
    providerModelId: "o1-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: ["seed", "max_tokens"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o1-mini:azure-openai": {
    provider: "azure-openai",
    author: "openai",
    providerModelId: "o1-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: ["seed", "max_tokens"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O1ModelName}:${ProviderName}`, ModelProviderConfig>
>;
