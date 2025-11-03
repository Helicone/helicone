import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MistralLargeModelName } from "./models";

export const endpoints = {
  "mistral-large-2411:mistralai": {
    providerModelId: "mistral-large-2411",
    provider: "mistralai",
    author: "mistralai",
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
} satisfies Partial<
  Record<
    `${MistralLargeModelName}:${ModelProviderName}` | MistralLargeModelName,
    ModelProviderConfig
  >
>;
