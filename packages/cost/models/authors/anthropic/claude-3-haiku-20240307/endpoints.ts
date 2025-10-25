import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { Claude3HaikuModelName } from "./model";

export const endpoints = {
  "claude-3-haiku-20240307:anthropic": {
    provider: "anthropic",
    author: "anthropic",
    providerModelId: "claude-3-haiku-20240307",
    priority: 3,
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25 per 1M tokens
        output: 0.00000125, // $1.25 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.12, // $0.03 per 1M tokens (0.03/0.25 = 0.12)
          write5m: 1.2, // $0.30 per 1M tokens (0.30/0.25 = 1.2)
          write1h: 2.0, // $0.50 per 1M tokens (0.50/0.25 = 2.0)
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
    responseFormat: "ANTHROPIC",
  },
  "claude-3-haiku-20240307:helicone": {
    provider: "helicone",
    author: "anthropic",
    providerModelId: "pa/cd-3-hk-20240307",
    pricing: [
      {
        threshold: 0,
        input: 0.00000025, // $0.25 per 1M tokens
        output: 0.00000125, // $1.25 per 1M tokens
        cacheMultipliers: {
          cachedInput: 0.12, // $0.03 per 1M tokens (0.03/0.25 = 0.12)
          write5m: 1.2, // $0.30 per 1M tokens (0.30/0.25 = 1.2)
          write1h: 2.0, // $0.50 per 1M tokens (0.50/0.25 = 2.0)
        },
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    ptbEnabled: true,
    priority: 2,
    endpointConfigs: {
      "*": {},
    },
    responseFormat: "ANTHROPIC",
  },
} satisfies Partial<
  Record<`${Claude3HaikuModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
