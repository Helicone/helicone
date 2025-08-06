/**
 * Perplexity endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { PerplexityModelName } from "./models";

export const perplexityEndpoints = {
  "sonar-reasoning-pro": [
    {
      name: "Perplexity | perplexity/sonar-reasoning-pro",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
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
  ],

  "sonar-pro": [
    {
      name: "Perplexity | perplexity/sonar-pro",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
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
  ],

  "sonar-deep-research": [
    {
      name: "Perplexity | perplexity/sonar-deep-research",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
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
  ],

  "r1-1776": [
    {
      name: "Perplexity | perplexity/r1-1776",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
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
    {
      name: "Together | perplexity/r1-1776",
      provider: "together",
      tag: "together",
      status: 0,
      pricing: {
        prompt: 3,
        completion: 7,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 163840,
      maxCompletionTokens: null,
      supportedParameters: [
        "reasoning",
        "include_reasoning",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "repetition_penalty",
      ],
    },
  ],

  "sonar-reasoning": [
    {
      name: "Perplexity | perplexity/sonar-reasoning",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
      pricing: {
        prompt: 1,
        completion: 5,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 127000,
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
  ],

  sonar: [
    {
      name: "Perplexity | perplexity/sonar",
      provider: "perplexity",
      tag: "perplexity",
      status: 0,
      pricing: {
        prompt: 1,
        completion: 1,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 127072,
      maxCompletionTokens: null,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "top_k",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  ],
} satisfies Record<PerplexityModelName, ModelEndpoint[]>;

export default perplexityEndpoints;
