import type { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import type { Ornith15ModelName } from "./models";

export const endpoints = {
  "ornith-1.5-35b-a3b:tiyuvta": {
    providerModelId: "ornith-ai/ornith-1.5-35b-a3b",
    provider: "tiyuvta",
    author: "ornith-ai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025,
        output: 0.0000012,
        cacheMultipliers: {
          cachedInput: 0.36,
        },
      },
    ],
    quantization: "fp4",
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "seed",
      "response_format",
      "structured_outputs",
      "tools",
      "tool_choice",
      "reasoning",
      "reasoning_effort",
      "include_reasoning",
      "top_k",
      "min_p",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
    ],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${Ornith15ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
