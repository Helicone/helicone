import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPTImage1ModelName } from "./models";

export const endpoints = {
  "gpt-image-1:openai": {
    providerModelId: "gpt-image-1",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00000625, // $6.25 per 1M tokens
        output: 0.0000125, // $12.50 per 1M tokens
      },
    ],
    contextLength: 8192,
    maxCompletionTokens: 4096,
    rateLimits: {
      rpm: 500,
      tpm: 1000000,
    },
    supportedParameters: ["n"],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
  "gpt-image-1.5:openai": {
    providerModelId: "gpt-image-1.5",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.000005, // $5.00 per 1M tokens
        output: 0.00001, // $10.00 per 1M tokens
      },
    ],
    contextLength: 8192,
    maxCompletionTokens: 4096,
    rateLimits: {
      rpm: 500,
      tpm: 1000000,
    },
    supportedParameters: ["n"],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${GPTImage1ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
