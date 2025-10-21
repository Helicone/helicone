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
        input: 0.000015, // $15.00 per 1M tokens
        output: 0.00012, // $120.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000025, // $0.25 per 1M tokens
        output: 0.000002, // $2.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000005, // $0.05 per 1M tokens
        output: 0.0000004, // $0.40 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000125, // $1.25 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.000002, // $2.00 per 1M tokens
        output: 0.000008, // $8.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.0000001, // $0.10 per 1M tokens
        output: 0.0000004, // $0.40 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.0000004, // $0.40 per 1M tokens
        output: 0.0000016, // $1.60 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.0000025, // $2.50 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.00000015, // $0.15 per 1M tokens
        output: 0.0000006, // $0.60 per 1M tokens
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
    requireExplicitRouting: true,
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
        input: 0.000015, // $15.00 per 1M tokens
        output: 0.00006, // $60.00 per 1M tokens
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
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
        input: 0.0000011, // $1.10 per 1M tokens
        output: 0.0000044, // $4.40 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
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
        input: 0.000002, // $2.00 per 1M tokens
        output: 0.000008, // $8.00 per 1M tokens
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
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
        input: 0.0000011, // $1.10 per 1M tokens
        output: 0.0000044, // $4.40 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
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
        input: 0.0000011, // $1.10 per 1M tokens
        output: 0.0000044, // $4.40 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${HeliconeOpenAIModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
