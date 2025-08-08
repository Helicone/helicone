/**
 * OpenAI endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { OpenAIModelName } from "./models";

export const openaiEndpoints = {
  "o3-pro": {
    openai: {
      name: "OpenAI | openai/o3-pro-2025-06-10",
      providerModelId: "o3-pro-2025-06-10",
      pricing: {
        prompt: 20,
        completion: 80,
        image: 0.0153,
        cacheRead: null,
        cacheWrite: null,
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
    },
  },

  "o4-mini-high": {
    openai: {
      name: "OpenAI | openai/o4-mini-high-2025-04-16",
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        image: 0.0008415,
        cacheRead: 0.275,
        cacheWrite: null,
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
    },
  },

  o3: {
    openai: {
      name: "OpenAI | openai/o3-2025-04-16",

      pricing: {
        prompt: 2,
        completion: 8,
        image: 0.00153,
        cacheRead: 0.5,
        cacheWrite: null,
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
    },
  },

  "o4-mini": {
    openai: {
      name: "OpenAI | openai/o4-mini-2025-04-16",
      providerModelId: "o4-mini",
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        image: 0.0008415,
        cacheRead: 0.275,
        cacheWrite: null,
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
    },
  },

  "gpt-4.1": {
    openai: {
      name: "OpenAI | openai/gpt-4.1-2025-04-14",
      providerModelId: "gpt-4.1",
      pricing: {
        prompt: 2,
        completion: 8,
        cacheRead: 0.5,
        cacheWrite: null,
      },
      contextLength: 1047576,
      maxCompletionTokens: 32768,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "gpt-4.1-mini": {
    openai: {
      name: "OpenAI | openai/gpt-4.1-mini-2025-04-14",
      providerModelId: "gpt-4.1-mini",
      pricing: {
        prompt: 0.4,
        completion: 1.6,
        cacheRead: 0.1,
        cacheWrite: null,
      },
      contextLength: 1047576,
      maxCompletionTokens: 32768,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "gpt-4.1-nano": {
    openai: {
      name: "OpenAI | openai/gpt-4.1-nano-2025-04-14",
      providerModelId: "gpt-4.1-nano",
      pricing: {
        prompt: 0.1,
        completion: 0.4,
        cacheRead: 0.025,
        cacheWrite: null,
      },
      contextLength: 1047576,
      maxCompletionTokens: 32768,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "o1-pro": {
    openai: {
      name: "OpenAI | openai/o1-pro",
      providerModelId: "o1-pro",
      pricing: {
        prompt: 150,
        completion: 600,
        image: 0.21675,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: ["seed", "max_tokens", "response_format"],
    },
  },

  "gpt-4o-mini-search-preview": {
    openai: {
      name: "OpenAI | openai/gpt-4o-mini-search-preview-2025-03-11",
      providerModelId: "gpt-4o-mini-search-preview",
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        image: 0.000217,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: ["max_tokens", "response_format"],
    },
  },

  "gpt-4o-search-preview": {
    openai: {
      name: "OpenAI | openai/gpt-4o-search-preview-2025-03-11",
      providerModelId: "gpt-4o-search-preview",
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: ["max_tokens", "response_format"],
    },
  },

  "o3-mini-high": {
    openai: {
      name: "OpenAI | openai/o3-mini-high-2025-01-31",
      providerModelId: "o3-mini-high",
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null,
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
    },
  },

  "o3-mini": {
    openai: {
      name: "OpenAI | openai/o3-mini-2025-01-31",
      providerModelId: "o3-mini",
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null,
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
    },
  },

  o1: {
    openai: {
      name: "OpenAI | openai/o1-2024-12-17",
      providerModelId: "o1",
      pricing: {
        prompt: 15,
        completion: 60,
        image: 0.021675,
        cacheRead: 7.5,
        cacheWrite: null,
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
    },
  },

  "o1-mini": {
    openai: {
      name: "OpenAI | openai/o1-mini",
      providerModelId: "o1-mini",
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 65536,
      supportedParameters: ["seed", "max_tokens"],
    },
  },

  "chatgpt-4o-latest": {
    openai: {
      name: "OpenAI | openai/chatgpt-4o-latest",
      providerModelId: "chatgpt-4o-latest",
      pricing: {
        prompt: 5,
        completion: 15,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "gpt-4o-mini": {
    openai: {
      name: "OpenAI | openai/gpt-4o-mini",
      providerModelId: "gpt-4o-mini",
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        image: 0.000217,
        cacheRead: 0.075,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
    "azure-openai": {
      name: "Azure | openai/gpt-4o-mini",
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        cacheRead: 0.075,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "seed",
        "response_format",
      ],
    },
  },

  "gpt-4o": {
    openai: {
      name: "OpenAI | openai/gpt-4o",
      providerModelId: "gpt-4o",
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: 1.25,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
    "azure-openai": {
      name: "Azure | openai/gpt-4o",
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "tools",
        "tool_choice",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "seed",
        "response_format",
      ],
    },
  },

  "gpt-4o:extended": {
    openai: {
      name: "OpenAI | openai/gpt-4o:extended",
      providerModelId: "gpt-4o:extended",
      pricing: {
        prompt: 6,
        completion: 18,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 128000,
      maxCompletionTokens: 64000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
  },

  "gpt-4": {
    openai: {
      name: "OpenAI | openai/gpt-4",
      pricing: {
        prompt: 30,
        completion: 60,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 8191,
      maxCompletionTokens: 4096,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ],
    },
    "azure-openai": {
      name: "Azure | openai/gpt-4",
      pricing: {
        prompt: 30,
        completion: 60,
        cacheRead: null,
        cacheWrite: null,
      },
      contextLength: 8191,
      maxCompletionTokens: 4096,
      supportedParameters: [
        "tools",
        "tool_choice",
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
        "seed",
        "response_format",
      ],
    },
  },
} satisfies Record<OpenAIModelName, ModelEndpointMap>;

export default openaiEndpoints;
