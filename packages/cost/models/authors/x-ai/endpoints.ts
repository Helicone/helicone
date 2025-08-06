/**
 * Xai endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { XAIModelName } from "./models";

export const xAiEndpoints = {
  "grok-4": {
    xai: {
      name: "xAI | x-ai/grok-4-07-09",
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: 0.75,
        cacheWrite: null,
      },
      contextLength: 256000,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "reasoning",
        "include_reasoning",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
      ],
    },
  },

  "grok-3-mini": {
    xai: {
      name: "xAI | x-ai/grok-3-mini",
      pricing: {
        prompt: 0.3,
        completion: 0.5,
        cacheRead: 0.075,
        cacheWrite: null,
      },
      contextLength: 131072,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "reasoning",
        "include_reasoning",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
      ],
    },
  },

  "grok-3": {
    xai: {
      name: "xAI | x-ai/grok-3",
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: 0.75,
        cacheWrite: null,
      },
      contextLength: 131072,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "grok-3-mini-beta": {
    xai: {
      name: "xAI | x-ai/grok-3-mini",
      pricing: {
        prompt: 0.3,
        completion: 0.5,
        cacheRead: 0.075,
        cacheWrite: null,
      },
      contextLength: 131072,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "reasoning",
        "include_reasoning",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
      ],
    },
  },

  "grok-3-beta": {
    xai: {
      name: "xAI | x-ai/grok-3",
      pricing: {
        prompt: 3,
        completion: 15,
        cacheRead: 0.75,
        cacheWrite: null,
      },
      contextLength: 131072,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "grok-2-vision-1212": {
    xai: {
      name: "xAI | x-ai/grok-2-vision-1212",
      pricing: {
        prompt: 2,
        completion: 10,
        image: 0.0036,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 32768,
      maxCompletionTokens: null,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "grok-2-1212": {
    xai: {
      name: "xAI | x-ai/grok-2-1212",
      pricing: {
        prompt: 2,
        completion: 10,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 131072,
      maxCompletionTokens: null,
      supportedParameters: [
        "tools",
        "tool_choice",
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "grok-vision-beta": {
    xai: {
      name: "xAI | x-ai/grok-vision-beta",
      pricing: {
        prompt: 5,
        completion: 15,
        image: 0.009,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 8192,
      maxCompletionTokens: null,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "seed",
        "response_format",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },
} satisfies Record<XAIModelName, ModelEndpointMap>;

export default xAiEndpoints;
