import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { HeliconeOpenAIModelName } from "./model";

export const endpoints = {
  "gpt-5-pro:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-pro",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // TODO: Update with actual discounted pricing
        output: 0.000015,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
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
  "gpt-5-codex:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-codex",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.000015,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.000015,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
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
  "gpt-5-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000003,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
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
  "gpt-5-nano:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-nano",
    pricing: [
      {
        threshold: 0,
        input: 0.0000005,
        output: 0.0000015,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-5-chat-latest:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gpt-5-chat-latest",
    pricing: [
      {
        threshold: 0,
        input: 0.000005,
        output: 0.000015,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 32768,
    supportedParameters: [
      "max_tokens",
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
  "gpt-4.1:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4.1",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000012,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
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
  "gpt-4.1-nano:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4.1-n",
    pricing: [
      {
        threshold: 0,
        input: 0.0000003,
        output: 0.0000012,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 8192,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-4.1-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4.1-m",
    pricing: [
      {
        threshold: 0,
        input: 0.0000015,
        output: 0.000006,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 16384,
    supportedParameters: [
      "max_tokens",
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
  "gpt-4o:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4p",
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
      "max_tokens",
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
  "gpt-4o-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/gt-4p-m",
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
      "max_tokens",
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
  "o1:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p1",
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
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o1-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p1-m",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000012,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p3",
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
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o3-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p3-m",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000012,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o4-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/o4-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000012,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${HeliconeOpenAIModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
