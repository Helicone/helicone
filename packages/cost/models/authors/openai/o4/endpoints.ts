import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O4ModelName } from "./models";
export const endpoints = {
  "o4-mini:openai": {
    providerModelId: "o4-mini",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011,
        output: 0.0000044,
        cacheMultipliers: {
          read: 0.25,
        },
      },
    ],
    rateLimits: {
      rpm: 30000,
      tpm: 150000000,
      tpd: 15000000000,
    },
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "tools",
      "tool_choice",
      "seed",
      "max_tokens",
      "response_format",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O4ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
