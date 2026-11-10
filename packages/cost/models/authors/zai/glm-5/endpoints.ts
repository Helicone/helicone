import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ZaiGlm5ModelName } from "./models";

export const endpoints = {
  "glm-5.3:engy": {
    providerModelId: "glm-5.3",
    provider: "engy",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000098, // $0.98/1M
        output: 0.00000308, // $3.08/1M
        cacheMultipliers: {
          cachedInput: 0.184, // $0.18/1M cache read vs $0.98/1M input
        },
      },
    ],
    contextLength: 327_680,
    maxCompletionTokens: 131_072,
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
  "glm-5.3-flash:engy": {
    providerModelId: "glm-5.3-flash",
    provider: "engy",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.000000135, // $0.135/1M
        output: 0.00000045, // $0.45/1M
        cacheMultipliers: {
          cachedInput: 0.2, // $0.027/1M cache read (20% of input)
        },
      },
    ],
    contextLength: 327_680,
    maxCompletionTokens: 131_072,
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
  "glm-5.2:engy": {
    providerModelId: "glm-5.2",
    provider: "engy",
    author: "zai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000068, // $0.68/1M
        output: 0.0000015, // $1.50/1M
        cacheMultipliers: {
          cachedInput: 0.265, // $0.18/1M cache read vs $0.68/1M input
        },
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 131_072,
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
    `${ZaiGlm5ModelName}:${ModelProviderName}` | ZaiGlm5ModelName,
    ModelProviderConfig
  >
>;
