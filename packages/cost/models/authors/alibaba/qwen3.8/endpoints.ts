import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Qwen38ModelName } from "./models";

export const endpoints = {
  "qwen3.8-max:scx": {
    providerModelId: "Qwen3.8-Max",
    provider: "scx",
    author: "alibaba",
    pricing: [
      {
        threshold: 0,
        input: 0.000001815,
        output: 0.0000054461,
        cacheMultipliers: {
          cachedInput: 0.1157, // $0.21/M cache read vs $1.815/M input
        },
      },
    ],
    contextLength: 1_000_000,
    maxCompletionTokens: 131_072,
    // Qwen thinking models reject tool_choice "required" or an object, so
    // tool_choice is intentionally left out.
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "reasoning",
      "tools",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<
    `${Qwen38ModelName}:${ModelProviderName}` | Qwen38ModelName,
    ModelProviderConfig
  >
>;
