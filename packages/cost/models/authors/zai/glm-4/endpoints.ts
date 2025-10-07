import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ZaiModelName } from "./models";

export const endpoints = {
  "glm-4.6:novita": {
    providerModelId: "zai-org/glm-4.6",
    provider: "novita",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006,
        output: 0.0000022
      },
    ],
    quantization: "bf16",
    contextLength: 204_800,
    maxCompletionTokens: 131_072,
    supportedParameters: [
      "functions",
      "structured_outputs",
      "reasoning",
      "tool_choice",
      "tools",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${ZaiModelName}:${ModelProviderName}` | ZaiModelName,
    ModelProviderConfig
  >
>;
