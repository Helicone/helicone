import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { NomicEmbedTextModelName } from "./models";

export const endpoints = {
  "nomic-embed-text:neuronpool": {
    providerModelId: "nomic-embed-text",
    provider: "neuronpool",
    author: "nomic",
    pricing: [
      {
        threshold: 0,
        input: 5e-9,
        output: 0,
      },
    ],
    rateLimits: {
      rpm: 600,
    },
    contextLength: 8192,
    maxCompletionTokens: 8192,
    supportedParameters: [],
    ptbEnabled: false,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${NomicEmbedTextModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
