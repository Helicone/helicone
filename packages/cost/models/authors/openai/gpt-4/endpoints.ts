import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPT4ModelName } from "./models";
export const endpoints = {
  "gpt-4:openai": {
    providerModelId: "gpt-4",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00003,
        output: 0.00006,
      },
    ],
    contextLength: 8191,
    maxCompletionTokens: 4096,
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
  "gpt-4:azure-openai": {
    providerModelId: "gpt-4",
    provider: "azure-openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00003,
        output: 0.00006,
      },
    ],
    contextLength: 8191,
    maxCompletionTokens: 4096,
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
  Record<`${GPT4ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
