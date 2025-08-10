/**
 * Perplexity endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { PerplexityModelName } from "./models";

/**
 * Perplexity endpoint IDs
 */
export type PerplexityEndpointId = `${PerplexityModelName}:perplexity`;

export const perplexityEndpoints = {
  "sonar-reasoning-pro:perplexity": {
    modelId: "sonar-reasoning-pro",
    provider: "perplexity",
    providerModelId: "sonar-reasoning-pro",
    pricing: {
      prompt: 2,
      completion: 8,
    },
    contextLength: 128000,
    maxCompletionTokens: 8000,
    supportedParameters: [
      "reasoning",
      "include_reasoning",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
  },
  "sonar-pro:perplexity": {
    modelId: "sonar-pro",
    provider: "perplexity",
    providerModelId: "sonar-pro",
    pricing: {
      prompt: 3,
      completion: 15,
    },
    contextLength: 200000,
    maxCompletionTokens: 8000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
  },
  "sonar:perplexity": {
    modelId: "sonar",
    provider: "perplexity",
    providerModelId: "sonar",
    pricing: {
      prompt: 1,
      completion: 5,
    },
    contextLength: 200000,
    maxCompletionTokens: 8000,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
  },
  "sonar-reasoning:perplexity": {
    modelId: "sonar-reasoning",
    provider: "perplexity",
    providerModelId: "sonar-reasoning",
    pricing: {
      prompt: 1,
      completion: 5,
    },
    contextLength: 128000,
    maxCompletionTokens: 8000,
    supportedParameters: [
      "reasoning",
      "include_reasoning",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "frequency_penalty",
      "presence_penalty",
    ],
    ptbEnabled: true,
  },
} satisfies Record<PerplexityEndpointId, Endpoint>;
