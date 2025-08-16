import { ProviderName } from "@/cost/models/providers";
import type { ModelProviderConfig } from "../../../types";
import { O1ModelName } from "./models";

export const endpoints = {
  "o1:openai": {
    provider: "openai",
    providerModelId: "o1",
    pricing: {
      prompt: 15,
      completion: 60,
      image: 0.021675,
      cacheRead: 7.5,
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
      prompt: 15,
      completion: 60,
      cacheRead: 7.5,
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
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
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
