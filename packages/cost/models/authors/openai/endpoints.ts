/**
 * OpenAI endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { OpenAIModelName } from "./models";

export const openaiEndpoints = {
  "o3-pro": [
    {
      name: "OpenAI | openai/o3-pro-2025-06-10",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 20,
        completion: 80,
        image: 0.0153,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "codex-mini": [
    {
      name: "OpenAI | openai/codex-mini",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.5,
        completion: 6,
        cacheRead: 0.375,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o4-mini-high": [
    {
      name: "OpenAI | openai/o4-mini-high-2025-04-16",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        image: 0.0008415,
        cacheRead: 0.275,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o3": [
    {
      name: "OpenAI | openai/o3-2025-04-16",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2,
        completion: 8,
        image: 0.00153,
        cacheRead: 0.5,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o4-mini": [
    {
      name: "OpenAI | openai/o4-mini-2025-04-16",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        image: 0.0008415,
        cacheRead: 0.275,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "gpt-4.1": [
    {
      name: "OpenAI | openai/gpt-4.1-2025-04-14",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2,
        completion: 8,
        cacheRead: 0.5,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4.1-mini": [
    {
      name: "OpenAI | openai/gpt-4.1-mini-2025-04-14",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.4,
        completion: 1.6,
        cacheRead: 0.1,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4.1-nano": [
    {
      name: "OpenAI | openai/gpt-4.1-nano-2025-04-14",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.1,
        completion: 0.4,
        cacheRead: 0.025,
        cacheWrite: null
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
      ]
    }
  ],
  
  "o1-pro": [
    {
      name: "OpenAI | openai/o1-pro",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 150,
        completion: 600,
        image: 0.21675,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "gpt-4o-mini-search-preview": [
    {
      name: "OpenAI | openai/gpt-4o-mini-search-preview-2025-03-11",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        image: 0.000217,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "gpt-4o-search-preview": [
    {
      name: "OpenAI | openai/gpt-4o-search-preview-2025-03-11",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
      maxCompletionTokens: 16384,
      supportedParameters: [
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o3-mini-high": [
    {
      name: "OpenAI | openai/o3-mini-high-2025-01-31",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o3-mini": [
    {
      name: "OpenAI | openai/o3-mini-2025-01-31",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "o1": [
    {
      name: "OpenAI | openai/o1-2024-12-17",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 15,
        completion: 60,
        image: 0.021675,
        cacheRead: 7.5,
        cacheWrite: null
      },
      contextLength: 200000,
      maxCompletionTokens: 100000,
      supportedParameters: [
        "tools",
        "tool_choice",
        "seed",
        "max_tokens",
        "response_format"
      ]
    }
  ],
  
  "gpt-4o-2024-11-20": [
    {
      name: "OpenAI | openai/gpt-4o-2024-11-20",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: 1.25,
        cacheWrite: null
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
      ]
    }
  ],
  
  "o1-mini": [
    {
      name: "OpenAI | openai/o1-mini",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null
      },
      contextLength: 128000,
      maxCompletionTokens: 65536,
      supportedParameters: [
        "seed",
        "max_tokens"
      ]
    }
  ],
  
  "o1-mini-2024-09-12": [
    {
      name: "OpenAI | openai/o1-mini-2024-09-12",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.1,
        completion: 4.4,
        cacheRead: 0.55,
        cacheWrite: null
      },
      contextLength: 128000,
      maxCompletionTokens: 65536,
      supportedParameters: [
        "seed",
        "max_tokens"
      ]
    }
  ],
  
  "chatgpt-4o-latest": [
    {
      name: "OpenAI | openai/chatgpt-4o-latest",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 5,
        completion: 15,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4o-2024-08-06": [
    {
      name: "Azure | openai/gpt-4o-2024-08-06",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: 1.25,
        cacheWrite: null
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
        "response_format"
      ]
    },
    {
      name: "OpenAI | openai/gpt-4o-2024-08-06",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: 1.25,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4o-mini": [
    {
      name: "OpenAI | openai/gpt-4o-mini",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        image: 0.000217,
        cacheRead: 0.075,
        cacheWrite: null
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
      ]
    },
    {
      name: "Azure | openai/gpt-4o-mini",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        cacheRead: 0.075,
        cacheWrite: null
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
        "response_format"
      ]
    }
  ],
  
  "gpt-4o-mini-2024-07-18": [
    {
      name: "OpenAI | openai/gpt-4o-mini-2024-07-18",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.15,
        completion: 0.6,
        image: 0.007225,
        cacheRead: 0.075,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4o-2024-05-13": [
    {
      name: "OpenAI | openai/gpt-4o-2024-05-13",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 5,
        completion: 15,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
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
      ]
    },
    {
      name: "Azure | openai/gpt-4o-2024-05-13",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 5,
        completion: 15,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
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
        "response_format"
      ]
    }
  ],
  
  "gpt-4o": [
    {
      name: "OpenAI | openai/gpt-4o",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: 1.25,
        cacheWrite: null
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
      ]
    },
    {
      name: "Azure | openai/gpt-4o",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 2.5,
        completion: 10,
        image: 0.003613,
        cacheRead: null,
        cacheWrite: null
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
        "response_format"
      ]
    }
  ],
  
  "gpt-4o:extended": [
    {
      name: "OpenAI | openai/gpt-4o:extended",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 6,
        completion: 18,
        image: 0.007225,
        cacheRead: null,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4-turbo": [
    {
      name: "OpenAI | openai/gpt-4-turbo",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 10,
        completion: 30,
        image: 0.01445,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
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
      ]
    }
  ],
  
  "gpt-3.5-turbo-0613": [
    {
      name: "Azure | openai/gpt-3.5-turbo-0613",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 1,
        completion: 2,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 4095,
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
        "response_format"
      ]
    }
  ],
  
  "gpt-4-turbo-preview": [
    {
      name: "OpenAI | openai/gpt-4-turbo-preview",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 10,
        completion: 30,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
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
      ]
    }
  ],
  
  "gpt-4-1106-preview": [
    {
      name: "OpenAI | openai/gpt-4-1106-preview",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 10,
        completion: 30,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 128000,
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
      ]
    }
  ],
  
  "gpt-3.5-turbo-instruct": [
    {
      name: "OpenAI | openai/gpt-3.5-turbo-instruct",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 1.5,
        completion: 2,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 4095,
      maxCompletionTokens: 4096,
      supportedParameters: [
        "seed",
        "max_tokens",
        "response_format",
        "temperature",
        "top_p",
        "stop",
        "frequency_penalty",
        "presence_penalty",
      ]
    }
  ],
  
  "gpt-3.5-turbo-16k": [
    {
      name: "OpenAI | openai/gpt-3.5-turbo-16k",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 3,
        completion: 4,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 16385,
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
      ]
    },
    {
      name: "Azure | openai/gpt-3.5-turbo-16k",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 3,
        completion: 4,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 16385,
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
        "response_format"
      ]
    }
  ],
  
  "gpt-3.5-turbo": [
    {
      name: "OpenAI | openai/gpt-3.5-turbo",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 0.5,
        completion: 1.5,
        cacheRead: null,
        cacheWrite: null
      },
      contextLength: 16385,
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
      ]
    }
  ],
  
  "gpt-4-0314": [
    {
      name: "OpenAI | openai/gpt-4-0314",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 30,
        completion: 60,
        cacheRead: null,
        cacheWrite: null
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
      ]
    }
  ],
  
  "gpt-4": [
    {
      name: "OpenAI | openai/gpt-4",
      provider: "openai",
      tag: "openai",
      status: 0,
      pricing: {
        prompt: 30,
        completion: 60,
        cacheRead: null,
        cacheWrite: null
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
      ]
    },
    {
      name: "Azure | openai/gpt-4",
      provider: "azure-openai",
      tag: "azure",
      status: 0,
      pricing: {
        prompt: 30,
        completion: 60,
        cacheRead: null,
        cacheWrite: null
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
        "response_format"
      ]
    }
  ]
} satisfies Record<OpenAIModelName, ModelEndpoint[]>;

export default openaiEndpoints;