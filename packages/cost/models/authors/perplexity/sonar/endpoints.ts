import { ModelProviderName } from "../../../providers";
import type { ModelProviderConfig } from "../../../types";
import { PerplexityModelName } from "./models";

export const endpoints = {
  "sonar:perplexity": {
    providerModelId: "sonar",
    provider: "perplexity",
    author: "perplexity",
    pricing: [
      {
        threshold: 0,
        input: 0.000001, // $1.00 per 1M tokens
        output: 0.000001, // $1.00 per 1M tokens
        request: 0.005, // $5.00 per 1K requests (Low search mode)
        audio: 0.0,
        web_search: 0.005, // Base request fee
      },
    ],
    contextLength: 127000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "frequency_penalty",
      "response_format",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "sonar-pro:perplexity": {
    providerModelId: "sonar-pro",
    provider: "perplexity",
    author: "perplexity",
    pricing: [
      {
        threshold: 0,
        input: 0.000003, // $3.00 per 1M tokens
        output: 0.000015, // $15.00 per 1M tokens
        request: 0.006, // $6.00 per 1K requests (Low search mode)
        audio: 0.0,
        web_search: 0.006, // Base request fee
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "frequency_penalty",
      "response_format",
      "stop",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "sonar-reasoning:perplexity": {
    providerModelId: "sonar-reasoning",
    provider: "perplexity",
    author: "perplexity",
    pricing: [
      {
        threshold: 0,
        input: 0.000001, // $1.00 per 1M tokens
        output: 0.000005, // $5.00 per 1M tokens
        request: 0.005, // $5.00 per 1K requests (Low search mode)
        audio: 0.0,
        web_search: 0.005, // Base request fee
      },
    ],
    contextLength: 127000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "frequency_penalty",
      "response_format",
      "stop",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "sonar-reasoning-pro:perplexity": {
    providerModelId: "sonar-reasoning-pro",
    provider: "perplexity",
    author: "perplexity",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2.00 per 1M tokens
        output: 0.000008, // $8.00 per 1M tokens
        request: 0.006, // $6.00 per 1K requests (Low search mode)
        audio: 0.0,
        web_search: 0.006, // Base request fee
      },
    ],
    contextLength: 127000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "frequency_penalty",
      "response_format",
      "stop",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
  "sonar-deep-research:perplexity": {
    providerModelId: "sonar-deep-research",
    provider: "perplexity",
    author: "perplexity",
    pricing: [
      {
        threshold: 0,
        input: 0.000002, // $2.00 per 1M tokens (base input)
        output: 0.000008, // $8.00 per 1M tokens (base output)
        request: 0.0,
        audio: 0.0,
        web_search: 0.005, // $5.00 per 1K searches
        // Note: Additional pricing for citation tokens ($2/1M) and reasoning tokens ($3/1M)
        // are handled separately by the Perplexity provider
      },
    ],
    contextLength: 127000,
    maxCompletionTokens: 4096,
    supportedParameters: [
      "max_tokens",
      "temperature",
      "top_p",
      "frequency_penalty",
      "response_format",
      "stop",
      "reasoning",
    ],
    ptbEnabled: true,
    endpointConfigs: {
      "*": {},
    },
  },
} satisfies Partial<
  Record<`${PerplexityModelName}:${ModelProviderName}`, ModelProviderConfig>
>;
