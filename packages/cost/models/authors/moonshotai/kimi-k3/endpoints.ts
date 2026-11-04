import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { KimiK3ModelName } from "./models";

export const endpoints = {
  "kimi-k3:openrouter": {
    provider: "openrouter",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k3",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00/1M (openrouter.ai/api/v1/models, 2026-07-28)
        output: 0.000015, // $15.00/1M
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30/1M (10% of input)
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 1_048_576,
    supportedParameters: [
      "frequency_penalty",
      "include_reasoning",
      "logit_bias",
      "logprobs",
      "max_tokens",
      "min_p",
      "presence_penalty",
      "reasoning",
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
      "top_p",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "kimi-k3:novita": {
    provider: "novita",
    author: "moonshotai",
    providerModelId: "moonshotai/kimi-k3",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00/1M (api.novita.ai/v3/openai/models, 2026-07-28)
        output: 0.000015, // $15.00/1M
        cacheMultipliers: {
          cachedInput: 0.1, // $0.30/1M (10% of input)
        },
      },
    ],
    contextLength: 1_048_576,
    maxCompletionTokens: 1_048_576,
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
  Record<`${KimiK3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
