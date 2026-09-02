import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeFable51ModelName } from "./model";

export const endpoints = {
  "claude-5.1-fable:anthropic": {
    providerModelId: "claude-fable-5-1",
    provider: "anthropic",
    author: "anthropic",
    pricing: [
      {
        threshold: 0,
        input: 0.00001, // $10 / MTok
        output: 0.00005, // $50 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.025, // $0.25 / MTok (2.5% of $10; 0.025x on Fable 5.1, not the usual 0.1x)
          write5m: 1.25, // $12.50 / MTok (125% of $10)
          write1h: 2.0, // $20 / MTok (200% of $10)
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
  Record<`${ClaudeFable51ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
