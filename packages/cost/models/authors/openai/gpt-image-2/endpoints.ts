import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { GPTImage2ModelName } from "./models";

export const endpoints = {
  "gpt-image-2:openai": {
    providerModelId: "gpt-image-2",
    provider: "openai",
    author: "openai",
    pricing: [
      {
        threshold: 0,
        input: 0.00001, // $10.00 per 1M tokens
        output: 0.00004, // $40.00 per 1M tokens
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
  Record<`${GPTImage2ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
