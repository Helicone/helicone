import type { ModelProviderConfig } from "../../../types";

export const endpoints = {
  "gpt-4:openai": {
    modelId: "gpt-4",
    provider: "openai",
    baseModelId: "gpt-4",
    pricing: {
      prompt: 30,
      completion: 60,
    },
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
  },
} satisfies Record<string, ModelProviderConfig>;

export type EndpointId = keyof typeof endpoints;
