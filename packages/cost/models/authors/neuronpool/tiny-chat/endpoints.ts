import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { NeuronpoolTinyChatModelName } from "./models";

export const endpoints = {
  "neuronpool-tiny-chat:neuronpool": {
    providerModelId: "neuronpool-tiny-chat",
    provider: "neuronpool",
    author: "neuronpool",
    pricing: [
      {
        threshold: 0,
        input: 1e-9,
        output: 2e-9,
      },
    ],
    rateLimits: {
      rpm: 600,
    },
    contextLength: 4096,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stream",
      "tools",
      "tool_choice",
      "response_format",
      "structured_outputs",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${NeuronpoolTinyChatModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
