import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Qwen25ModelName } from "./models";

export const endpoints = {
  "qwen2.5-coder-7b-fast:nebius": {
    providerModelId: "Qwen/Qwen2.5-Coder-7B-fast",
    provider: "nebius",
    author: "alibaba",
    pricing: [
      {
        threshold: 0,
        input: 0.00000003,
        output: 0.00000009
      },
    ],
    contextLength: 32_000,
    maxCompletionTokens: 8_192,
    supportedParameters: [
      "structured_outputs",
      "response_format",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "logit_bias",
      "logprobs",
      "top_logprobs"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Qwen25ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
