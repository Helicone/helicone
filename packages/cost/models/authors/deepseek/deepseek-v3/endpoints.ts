import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { DeepSeekV3ModelName } from "./model";

export const endpoints = {
  "deepseek-v3:deepseek": {
    provider: "deepseek",
    author: "deepseek",
    providerModelId: "deepseek-chat",
    pricing: [
      {
        threshold: 0,
        input: 0.00000056, // $0.56 per 1M tokens (cache miss)
        output: 0.00000168, // $1.68 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.125, // $0.07 per 1M tokens (cache hit) = $0.56 * 0.125
        },
      },
    ],
    contextLength: 128_000,
    maxCompletionTokens: 8_192, // Maximum 8K (default 4K)
    supportedParameters: [
      "frequency_penalty",
      "function_call",
      "functions",
      "logprobs",
      "max_tokens",
      "presence_penalty",
      "response_format",
      "seed",
      "stop",
      "stream",
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
} satisfies Partial<
  Record<`${DeepSeekV3ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
