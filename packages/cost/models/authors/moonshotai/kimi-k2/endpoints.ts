import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { KimiK2ModelName } from "./models";

export const endpoints = {
  "kimi-k2:groq": {
    providerModelId: "moonshotai/Kimi-K2-Instruct",
    provider: "groq",
    author: "moonshotai",
    pricing: [
      {
        threshold: 0,
        input: 0.000001,
        output: 0.000003,
        request: 0.0,
        image: 0.0,
        audio: 0.0,
        web_search: 0.0,
        cacheMultipliers: {
          cachedInput: 0.5,
        },
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 16_384,
    supportedParameters: [
      "frequency_penalty",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "repetition_penalty",
      "response_format",
      "seed",
      "stop",
      "structured_outputs",
      "temperature",
      "tool_choice",
      "tools",
      "top_k",
      "top_logprobs",
      "top_p"
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${KimiK2ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
