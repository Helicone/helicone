import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { KimiK25ModelName } from "./models";

export const endpoints = {
  "kimi-k2.5:fireworks": {
    provider: "fireworks",
    author: "moonshotai",
    providerModelId: "accounts/fireworks/models/kimi-k2p5",
    pricing: [
      {
        threshold: 0,
        input: 0.0000012, // $1.20/1M
        output: 0.0000012, // $1.20/1M
        cacheMultipliers: {
          cachedInput: 0.5, // $0.60/1M (50% of input)
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
      "top_k",
      "repetition_penalty",
      "logit_bias",
      "logprobs",
      "top_logprobs",
      "response_format",
      "structured_outputs",
      "tools",
      "tool_choice",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2.5:openrouter": {
    provider: "openrouter",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2.5",
    pricing: [
      {
        threshold: 0,
        input: 0.000001266, // $1.266/1M - worst-case: $1.20/1M (Fireworks) * 1.055
        output: 0.000003165, // $3.165/1M - worst-case: $3.00/1M (Novita) * 1.055
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "frequency_penalty",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
      "seed",
      "stop",
      "temperature",
      "tool_choice",
      "tools",
      "top_logprobs",
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k2.5:novita": {
    provider: "novita",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k2.5",
    pricing: [
      {
        threshold: 0,
        input: 0.0000006, // $0.60/1M
        output: 0.000003, // $3.00/1M
      },
    ],
    contextLength: 262_144,
    maxCompletionTokens: 262_144,
    supportedParameters: [
      "structured_outputs",
      "functions",
      "tool_choice",
      "tools",
      "response_format",
      "max_tokens",
      "temperature",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
      "top_k",
      "min_p",
      "repetition_penalty",
      "logit_bias",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${KimiK25ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
