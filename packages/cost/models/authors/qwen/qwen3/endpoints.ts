import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Qwen3ModelName } from "./models";

export const endpoints = {
  "qwen3-30b-a3b:deepinfra": {
    providerModelId: "Qwen/Qwen3-30B-A3B",
    provider: "deepinfra",
    author: "qwen",
    pricing: [
      {
        threshold: 0,
        input: 0.00000008,
        output: 0.00000029,
      },
    ],
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
    },
    contextLength: 32_768,
    maxCompletionTokens: 32_768,
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
      "repetition_penalty",
      "top_k",
      "min_p",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },

} satisfies Partial<
  Record<`${Qwen3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
