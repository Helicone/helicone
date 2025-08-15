import { ProviderName } from "@/cost/models/providers";
import type { ModelProviderConfig } from "../../../types";
import { O3ModelName } from "./models";

export const endpoints = {
  "o3:openai": {
    providerModelId: "o3-2025-04-16",
    provider: "openai",
    pricing: {
      prompt: 2,
      completion: 8,
      cacheRead: 0.5,
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
  "o3-pro:openai": {
    providerModelId: "o3-pro-2025-06-10",
    provider: "openai",
    pricing: {
      prompt: 20,
      completion: 80,
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
  "o3-mini:openai": {
    providerModelId: "o3-mini",
    provider: "openai",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
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
  "o3-mini-high:openai": {
    providerModelId: "o3-mini-high",
    provider: "openai",
    pricing: {
      prompt: 1.1,
      completion: 4.4,
      cacheRead: 0.55,
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
  Record<`${O3ModelName}:${ProviderName}`, ModelProviderConfig>
>;
