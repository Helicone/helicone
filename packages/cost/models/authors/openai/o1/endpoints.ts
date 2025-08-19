import { ProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { O1ModelName } from "./models";

export const endpoints = {
  "o1:openai": {
    provider: "openai",
    providerModelId: "o1",
    pricing: {
      prompt: 0.000015,
      completion: 0.00006,
      image: 0.000000021675,
      cacheRead: 0.0000075,
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
  "o1-pro:openai": {
    provider: "openai",
    providerModelId: "o1-pro",
    pricing: {
      prompt: 0.000015,
      completion: 0.00006,
      cacheRead: 0.0000075,
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
  "o1-mini:openai": {
    provider: "openai",
    providerModelId: "o1-mini",
    pricing: {
      prompt: 0.0000011,
      completion: 0.0000044,
      cacheRead: 0.00000055,
    },
    contextLength: 128000,
    maxCompletionTokens: 65536,
    supportedParameters: ["seed", "max_tokens"],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${O1ModelName}:${ProviderName}`, ModelProviderConfig>
>;
