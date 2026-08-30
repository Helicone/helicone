import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { MinimaxM25ModelName } from "./models";

export const endpoints = {
  "minimax-m2.5:hpcai": {
    provider: "hpcai",
    author: "minimax",
    providerModelId: "minimax/minimax-m2.5",
    pricing: [
      {
        threshold: 0,
        input: 0.00000014, // $0.14/1M uncached input
        output: 0.00000056, // $0.56/1M output
        cacheMultipliers: {
          cachedInput: 0.1, // $0.014/1M cached input
        },
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "response_format",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${MinimaxM25ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
