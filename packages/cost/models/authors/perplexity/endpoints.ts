/**
 * Perplexity endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { PerplexityModelName } from "./models";

export const perplexityEndpoints = {
  "sonar-reasoning-pro": {
    perplexity: {
      name: "Perplexity | perplexity/sonar-reasoning-pro",
      pricing: {
        prompt: 2,
        completion: 8,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: null,
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
    },
  },

  "sonar-pro": {
    perplexity: {
      name: "Perplexity | perplexity/sonar-pro",
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: null,
        cacheWrite: null,
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
    },
  },

  sonar: {
    perplexity: {
      name: "Perplexity | perplexity/sonar",
      pricing: {
        prompt: 1,
        completion: 5,
        cacheRead: null,
        cacheWrite: null,
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
    },
  },

  "sonar-reasoning": {
    perplexity: {
      name: "Perplexity | perplexity/sonar-reasoning",
      pricing: {
        prompt: 1,
        completion: 5,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: null,
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
    },
  },
} satisfies Record<PerplexityModelName, ModelEndpointMap>;

export default perplexityEndpoints;
