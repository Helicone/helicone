import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeSonnet5ModelName } from "./model";

export const endpoints = {
  "claude-5-sonnet:anthropic": {
    providerModelId: "claude-sonnet-5",
    provider: "anthropic",
    author: "anthropic",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2 / MTok
        output: 0.00001, // $10 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.20 / MTok (10% of $2)
          write5m: 1.25, // $2.50 / MTok (125% of $2)
          write1h: 2.0, // $4 / MTok (200% of $2)
        },
      },
    ],
    contextLength: 1000000,
    maxCompletionTokens: 128000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "stop",
      "reasoning",
      "include_reasoning",
      "tools",
      "tool_choice",
    ],
    supportedPlugins: ["web"],
    ptbEnabled: true,
    responseFormat: "ANTHROPIC",
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${ClaudeSonnet5ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
