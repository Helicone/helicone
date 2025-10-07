import { ModelProviderName } from "../../providers";
import type { ModelProviderConfig } from "../../types";
import { HeliconeTestModelName } from "./models";

export const endpoints = {
  "helicone-test-free:openai": {
    provider: "openai",
    author: "helicone",
    providerModelId: "gpt-4o-mini",
    pricing: [
      {
        threshold: 0,
        input: 0,
        output: 0,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "helicone-test-cheap:openai": {
    provider: "openai",
    author: "helicone",
    providerModelId: "gpt-4o-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.0000001,
        output: 0.0000002,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "helicone-test-expensive:openai": {
    provider: "openai",
    author: "helicone",
    providerModelId: "gpt-4o-mini",
    pricing: [
      {
        threshold: 0,
        input: 0.00001,
        output: 0.00002,
      },
    ],
    contextLength: 128000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "stream",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${HeliconeTestModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
