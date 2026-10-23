import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { KimiK3ModelName } from "./models";

export const endpoints = {
  "kimi-k3:engy": {
    providerModelId: "kimi-k3",
    provider: "engy",
    author: "moonshotai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000195, // $1.95/1M
        output: 0.00000975, // $9.75/1M
        cacheMultipliers: {
          cachedInput: 0.1, // $0.195/1M cache read (10% of input)
        },
      },
    ],
    contextLength: 1_113_088,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "tools",
      "tool_choice",
      "response_format",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${KimiK3ModelName}:${ModelProviderName}` | KimiK3ModelName,
    ModelProviderConfig
  >
>;
