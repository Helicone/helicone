import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekV4ModelName } from "./models";

export const endpoints = {
  "deepseek-v4.1-flash:engy": {
    providerModelId: "deepseek-v4.1-flash",
    provider: "engy",
    author: "deepseek",
    pricing: [
      {
        threshold: 0,
        input: 0.00000004, // $0.04/1M
        output: 0.00000008, // $0.08/1M
        cacheMultipliers: {
          cachedInput: 0.2, // $0.008/1M cache read (20% of input)
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
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
  "deepseek-v4-flash-0731:engy": {
    providerModelId: "deepseek-v4-flash-0731",
    provider: "engy",
    author: "deepseek",
    pricing: [
      {
        threshold: 0,
        input: 0.000000045, // $0.045/1M
        output: 0.00000009, // $0.09/1M
        cacheMultipliers: {
          cachedInput: 0.2, // $0.009/1M cache read (20% of input)
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 65_536,
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
    `${DeepSeekV4ModelName}:${ModelProviderName}` | DeepSeekV4ModelName,
    ModelProviderConfig
  >
>;
