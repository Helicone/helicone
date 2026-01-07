import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralLargeModelName } from "./models";

export const endpoints = {
  "mistral-large-2411:mistral": {
    providerModelId: "mistral-large-2411",
    provider: "mistral",
    author: "mistral",
    pricing: [
      {
        threshold: 0,
        input: 0.000002,
        output: 0.000006,
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "response_format",
      "structured_outputs",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  // io.net Intelligence endpoints
  "mistral-large-2411:io-intelligence": {
    providerModelId: "mistralai/Mistral-Large-Instruct-2411",
    provider: "io-intelligence",
    author: "mistral",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2.00 per 1M tokens
        output: 0.000006, // $6.00 per 1M tokens
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 32_768,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "response_format",
      "structured_outputs",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${MistralLargeModelName}:${ModelProviderName}` | MistralLargeModelName,
    ModelProviderConfig
  >
>;
