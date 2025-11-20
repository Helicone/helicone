import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ErnieModelName } from "./models";

export const endpoints = {
  "ernie-4.5-21b-a3b-thinking:novita": {
    provider: "novita",
    author: "baidu",
    providerModelId: "baidu/ernie-4.5-21B-A3B-Thinking",
    pricing: [
      {
        threshold: 0,
        input: 0.00000007, // $0.07/1M
        output: 0.00000028, // $0.28/1M
      },
    ],
    quantization: "fp8",
    contextLength: 131_072,
    maxCompletionTokens: 65_536,
    supportedParameters: [
      "reasoning",
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
  Record<`${ErnieModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
