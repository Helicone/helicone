import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O1ModelName } from "./models";

export const endpoints = {
  "o1:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p1",
    pricing: [
      {
        threshold: 0,
        input: 0.000015, // $15.00 per 1M tokens
        output: 0.00006, // $60.00 per 1M tokens
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 100000,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "o1-mini:helicone": {
    provider: "helicone",
    author: "openai",
    providerModelId: "pa/p1-m",
    pricing: [
      {
        threshold: 0,
        input: 0.0000011, // $1.10 per 1M tokens
        output: 0.0000044, // $4.40 per 1M tokens
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: [
      "max_tokens",
    ],
    ptbEnabled: true,
    requireExplicitRouting: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O1ModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
