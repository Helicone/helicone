import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { ClaudeOpus48ModelName } from "./model";

export const endpoints = {
  "claude-4.8-opus:anthropic": {
    providerModelId: "claude-opus-4-8",
    provider: "anthropic",
    author: "anthropic",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5 / MTok
        output: 0.000025, // $25 / MTok
        web_search: 0.01, // $10 per 1000 searches (1:1 USD; 10/1K)
        cacheMultipliers: {
          cachedInput: 0.1, // $0.50 / MTok (10% of $5)
          write5m: 1.25, // $6.25 / MTok (125% of $5)
          write1h: 2.0, // $10 / MTok (200% of $5)
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
  Record<`${ClaudeOpus48ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
