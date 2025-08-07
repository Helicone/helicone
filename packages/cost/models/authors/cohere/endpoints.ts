/**
 * Cohere endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { CohereModelName } from "./models";

export const cohereEndpoints = {
  "command-a": [
    {
      name: "NextBit | cohere/command-a-03-2025",
      provider: "nextbit",
      tag: "nextbit/int4",
      status: 0,
      pricing: {
        prompt: 2,
        completion: 8,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 32768,
      maxCompletionTokens: null,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "response_format",
      ],
    },
    {
      name: "Cohere | cohere/command-a-03-2025",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 256000,
      maxCompletionTokens: 8192,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r7b-12-2024": [
    {
      name: "Cohere | cohere/command-r7b-12-2024",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 0.0375,
        completion: 0.15,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r-plus-08-2024": [
    {
      name: "Cohere | cohere/command-r-plus-08-2024",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r-08-2024": [
    {
      name: "Cohere | cohere/command-r-08-2024",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r-plus": [
    {
      name: "Cohere | cohere/command-r-plus",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r-plus-04-2024": [
    {
      name: "Cohere | cohere/command-r-plus-04-2024",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r": [
    {
      name: "Cohere | cohere/command-r",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 0.5,
        completion: 1.5,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  command: [
    {
      name: "Cohere | cohere/command",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 1,
        completion: 2,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 4096,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],

  "command-r-03-2024": [
    {
      name: "Cohere | cohere/command-r-03-2024",
      provider: "cohere",
      tag: "cohere",
      status: 0,
      pricing: {
        prompt: 0.5,
        completion: 1.5,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 4000,
      supportedParameters: [
        "tools",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "top_k",
        "seed",
        "response_format",
      ],
    },
  ],
} satisfies Record<CohereModelName, ModelEndpoint[]>;

export default cohereEndpoints;
