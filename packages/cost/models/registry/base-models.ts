/**
 * Base model definitions
 * Auto-generated on: 2025-08-03T05:49:23.186Z
 * Total base models: 32
 */

import type { BaseModel } from "../types";

export const baseModels = {
  "chatgpt-4o-latest": {
    id: "chatgpt-4o-latest",
    creator: "OpenAI",
    metadata: {
      displayName: "ChatGPT 4o Latest",
      description: "Latest ChatGPT model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-08-01",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 5,
          completion_token: 15,
        },
        modelString: "chatgpt-4o-latest",
        rateLimit: {
          tpm: 500000,
          rpm: 200,
        },
      },
    },
    slug: "chatgpt-4o-latest",
  },
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo",
      description: "Fast, inexpensive model for simple tasks",
      contextWindow: 16385,
      maxOutputTokens: 4096,
      releaseDate: "2023-06-13",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.5,
          completion_token: 1.5,
        },
        modelString: "gpt-3.5-turbo",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000,
        },
      },
    },
    slug: "gpt-3.5-turbo",
    variants: {
      "gpt-3.5-turbo-0125": {
        id: "gpt-3.5-turbo-0125",
      },
    },
  },
  "gpt-3.5-turbo-16k": {
    id: "gpt-3.5-turbo-16k",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo 16K",
      description: "Extended context version of GPT-3.5",
      contextWindow: 16385,
      maxOutputTokens: 4096,
      releaseDate: "2023-06-13",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 4,
        },
        modelString: "gpt-3.5-turbo-16k",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000,
        },
      },
    },
    slug: "gpt-3.5-turbo-16k",
    variants: {
      "gpt-3.5-turbo-16k-0613": {
        id: "gpt-3.5-turbo-16k-0613",
      },
    },
  },
  "gpt-3.5-turbo-instruct": {
    id: "gpt-3.5-turbo-instruct",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo Instruct",
      description: "Instruct-tuned version of GPT-3.5",
      contextWindow: 4096,
      maxOutputTokens: 4096,
      releaseDate: "2023-09-01",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 1.5,
          completion_token: 2,
        },
        modelString: "gpt-3.5-turbo-instruct",
        rateLimit: {
          tpm: 90000,
          rpm: 3500,
          tpd: 200000,
        },
      },
    },
    slug: "gpt-3.5-turbo-instruct",
  },
  "gpt-4": {
    id: "gpt-4",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4",
      description: "Original GPT-4 model",
      contextWindow: 8192,
      maxOutputTokens: 4096,
      releaseDate: "2023-03-14",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 30,
          completion_token: 60,
        },
        modelString: "gpt-4",
        rateLimit: {
          tpm: 1000000,
          rpm: 10000,
          tpd: 150000000,
        },
      },
    },
    slug: "gpt-4",
    variants: {
      "gpt-4-0613": {
        id: "gpt-4-0613",
      },
    },
  },
  "gpt-4-32k": {
    id: "gpt-4-32k",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4 32K",
      description: "Extended context GPT-4",
      contextWindow: 32768,
      maxOutputTokens: 4096,
      releaseDate: "2023-03-14",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 60,
          completion_token: 120,
        },
        modelString: "gpt-4-32k",
        rateLimit: {
          tpm: 250000,
          rpm: 3000,
        },
      },
    },
    slug: "gpt-4-32k",
  },
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4 Turbo",
      description: "Previous generation GPT-4 with 128K context",
      contextWindow: 128000,
      maxOutputTokens: 4096,
      releaseDate: "2024-04-09",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 10,
          completion_token: 30,
        },
        modelString: "gpt-4-turbo",
        rateLimit: {
          tpm: 2000000,
          rpm: 10000,
          tpd: 300000000,
        },
      },
    },
    slug: "gpt-4-turbo",
    variants: {
      "gpt-4-turbo-2024-04-09": {
        id: "gpt-4-turbo-2024-04-09",
      },
    },
  },
  "gpt-4.1": {
    id: "gpt-4.1",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1",
      description: "Latest generation model with improved performance",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5,
        },
        modelString: "gpt-4.1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000,
        },
      },
    },
    slug: "gpt-4.1",
    variants: {
      "gpt-4.1-2025-04-14": {
        id: "gpt-4.1-2025-04-14",
      },
    },
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1 Mini",
      description: "Smaller, faster variant of GPT-4.1",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.4,
          completion_token: 1.6,
          prompt_cache_read_token: 0.1,
        },
        modelString: "gpt-4.1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "gpt-4.1-mini",
    variants: {
      "gpt-4.1-mini-2025-04-14": {
        id: "gpt-4.1-mini-2025-04-14",
      },
    },
  },
  "gpt-4.1-nano": {
    id: "gpt-4.1-nano",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1 Nano",
      description: "Smallest and fastest GPT-4.1 variant",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.1,
          completion_token: 0.4,
          prompt_cache_read_token: 0.025,
        },
        modelString: "gpt-4.1-nano",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "gpt-4.1-nano",
    variants: {
      "gpt-4.1-nano-2025-04-14": {
        id: "gpt-4.1-nano-2025-04-14",
      },
    },
  },
  "gpt-4.5-preview": {
    id: "gpt-4.5-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.5 Preview",
      description: "Preview of next major GPT release",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-02-27",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 75,
          completion_token: 150,
          prompt_cache_read_token: 37.5,
        },
        modelString: "gpt-4.5-preview",
        rateLimit: {
          tpm: 250000,
          rpm: 3000,
        },
      },
    },
    slug: "gpt-4.5-preview",
    variants: {
      "gpt-4.5-preview-2025-02-27": {
        id: "gpt-4.5-preview-2025-02-27",
      },
    },
  },
  "gpt-4o": {
    id: "gpt-4o",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o",
      description:
        "OpenAI's most advanced multimodal model, 2x faster and 50% cheaper than GPT-4 Turbo",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-05-13",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 2.5,
          completion_token: 10,
          prompt_cache_read_token: 1.25,
        },
        modelString: "gpt-4o",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000,
        },
      },
    },
    slug: "gpt-4o",
    variants: {
      "gpt-4o-2024-08-06": {
        id: "gpt-4o-2024-08-06",
      },
      "gpt-4o-2024-11-20": {
        id: "gpt-4o-2024-11-20",
      },
      "gpt-4o-2024-05-13": {
        id: "gpt-4o-2024-05-13",
        providers: {
          openai: {
            provider: "openai",
            available: true,
            cost: {
              prompt_token: 5,
              completion_token: 15,
            },
            modelString: "gpt-4o-2024-05-13",
          },
        },
      },
    },
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Mini",
      description: "Affordable small model for fast, lightweight tasks",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-07-18",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.15,
          completion_token: 0.6,
          prompt_cache_read_token: 0.075,
        },
        modelString: "gpt-4o-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "gpt-4o-mini",
    variants: {
      "gpt-4o-mini-2024-07-18": {
        id: "gpt-4o-mini-2024-07-18",
      },
    },
  },
  "gpt-4o-mini-search-preview": {
    id: "gpt-4o-mini-search-preview",
    creator: "OpenAI",
    disabled: true,
    metadata: {
      displayName: "GPT-4o Mini Search Preview",
      description: "Search-optimized mini model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-03-11",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.15,
          completion_token: 0.6,
        },
        modelString: "gpt-4o-mini-search-preview",
        rateLimit: {
          tpm: 3000000,
          rpm: 1000,
        },
      },
    },
    slug: "gpt-4o-mini-search-preview",
    variants: {
      "gpt-4o-mini-search-preview-2025-03-11": {
        id: "gpt-4o-mini-search-preview-2025-03-11",
      },
    },
  },
  "gpt-4o-search-preview": {
    id: "gpt-4o-search-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Search Preview",
      description: "Search-optimized model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-03-11",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 2.5,
          completion_token: 10,
        },
        modelString: "gpt-4o-search-preview",
        rateLimit: {
          tpm: 3000000,
          rpm: 1000,
        },
      },
    },
    slug: "gpt-4o-search-preview",
    variants: {
      "gpt-4o-search-preview-2025-03-11": {
        id: "gpt-4o-search-preview-2025-03-11",
      },
    },
  },
  o1: {
    id: "o1",
    creator: "OpenAI",
    metadata: {
      displayName: "O1",
      description: "Reasoning model for complex tasks",
      contextWindow: 200000,
      maxOutputTokens: 100000,
      releaseDate: "2024-12-17",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 15,
          completion_token: 60,
          prompt_cache_read_token: 7.5,
        },
        modelString: "o1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000000,
        },
      },
    },
    slug: "o1",
    variants: {
      "o1-2024-12-17": {
        id: "o1-2024-12-17",
      },
      "o1-preview-2024-09-12": {
        id: "o1-preview-2024-09-12",
      },
    },
  },
  "o1-mini": {
    id: "o1-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O1 Mini",
      description: "Faster reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2024-09-12",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.55,
        },
        modelString: "o1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "o1-mini",
    variants: {
      "o1-mini-2024-09-12": {
        id: "o1-mini-2024-09-12",
      },
    },
  },
  "o1-pro": {
    id: "o1-pro",
    creator: "OpenAI",
    metadata: {
      displayName: "O1 Pro",
      description: "Premium reasoning model for the most complex tasks",
      contextWindow: 200000,
      maxOutputTokens: 100000,
      releaseDate: "2025-03-19",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 150,
          completion_token: 600,
        },
        modelString: "o1-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000,
        },
      },
    },
    slug: "o1-pro",
    variants: {
      "o1-pro-2025-03-19": {
        id: "o1-pro-2025-03-19",
      },
    },
  },
  o3: {
    id: "o3",
    creator: "OpenAI",
    metadata: {
      displayName: "O3",
      description: "Advanced reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-04-16",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5,
        },
        modelString: "o3",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000,
        },
      },
    },
    slug: "o3",
    variants: {
      "o3-2025-04-16": {
        id: "o3-2025-04-16",
      },
    },
  },
  "o3-deep-research": {
    id: "o3-deep-research",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Deep Research",
      description: "Specialized model for deep research tasks",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-26",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 10,
          completion_token: 40,
          prompt_cache_read_token: 2.5,
        },
        modelString: "o3-deep-research",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000,
        },
      },
    },
    slug: "o3-deep-research",
    variants: {
      "o3-deep-research-2025-06-26": {
        id: "o3-deep-research-2025-06-26",
      },
    },
  },
  "o3-mini": {
    id: "o3-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Mini",
      description: "Smaller O3 variant",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-01-31",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.55,
        },
        modelString: "o3-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "o3-mini",
    variants: {
      "o3-mini-2025-01-31": {
        id: "o3-mini-2025-01-31",
      },
    },
  },
  "o3-pro": {
    id: "o3-pro",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Pro",
      description: "Premium O3 model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-10",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 20,
          completion_token: 80,
        },
        modelString: "o3-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000,
        },
      },
    },
    slug: "o3-pro",
    variants: {
      "o3-pro-2025-06-10": {
        id: "o3-pro-2025-06-10",
      },
    },
  },
  "o4-mini": {
    id: "o4-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O4 Mini",
      description: "Latest mini reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-04-16",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.275,
        },
        modelString: "o4-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000,
        },
      },
    },
    slug: "o4-mini",
    variants: {
      "o4-mini-2025-04-16": {
        id: "o4-mini-2025-04-16",
      },
    },
  },
  "o4-mini-deep-research": {
    id: "o4-mini-deep-research",
    creator: "OpenAI",
    metadata: {
      displayName: "O4 Mini Deep Research",
      description: "Smaller deep research model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-26",
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5,
        },
        modelString: "o4-mini-deep-research",
        rateLimit: {
          tpm: 150000000,
          rpm: 10000,
          tpd: 10000000,
        },
      },
    },
    slug: "o4-mini-deep-research",
    variants: {
      "o4-mini-deep-research-2025-06-26": {
        id: "o4-mini-deep-research-2025-06-26",
      },
    },
  },
  // Anthropic Models
  "claude-opus-4-20250514": {
    id: "claude-opus-4-20250514",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Opus 4",
      description:
        "Most capable Claude model with extended thinking capabilities",
      contextWindow: 200000,
      maxOutputTokens: 32000,
      releaseDate: "2025-05-14",
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 15,
          completion_token: 75,
          prompt_cache_write_token: 0.00001875, // 5min cache
          prompt_cache_write_token_1hr: 0.00003, // 1hr cache
          prompt_cache_read_token: 0.0000015,
        },
      },
    },
    slug: "claude-opus-4",
  },
  "claude-sonnet-4-20250514": {
    id: "claude-sonnet-4-20250514",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 4",
      description: "Balanced Claude model with excellent performance and value",
      contextWindow: 200000,
      maxOutputTokens: 64000,
      releaseDate: "2025-05-14",
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75, // 5min cache
          prompt_cache_write_token_1hr: 6, // 1hr cache
          prompt_cache_read_token: 0.3,
        },
      },
    },
    slug: "claude-sonnet-4",
  },
  "claude-3-7-sonnet-20250219": {
    id: "claude-3-7-sonnet-20250219",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 3.7",
      description: "Advanced Sonnet model with extended thinking",
      contextWindow: 200000,
      maxOutputTokens: 64000,
      releaseDate: "2025-02-19",
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75, // 5min cache
          prompt_cache_write_token_1hr: 6, // 1hr cache
          prompt_cache_read_token: 0.3,
        },
      },
    },
    slug: "claude-sonnet-3-7",
  },
  "claude-3-5-sonnet-20241022": {
    id: "claude-3-5-sonnet-20241022",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 3.5",
      description: "High level of intelligence and capability",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      releaseDate: "2024-10-22",
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75, // 5min cache
          prompt_cache_write_token_1hr: 6, // 1hr cache
          prompt_cache_read_token: 0.3,
        },
      },
    },
    slug: "claude-sonnet-3-5",
  },
  "claude-3-5-haiku-20241022": {
    id: "claude-3-5-haiku-20241022",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Haiku 3.5",
      description: "Fast and efficient Claude model for routine tasks",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      releaseDate: "2024-10-22",
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 0.8,
          completion_token: 4,
          prompt_cache_write_token: 1, // 5min cache
          prompt_cache_write_token_1hr: 1.6, // 1hr cache
          prompt_cache_read_token: 0.08,
        },
      },
    },
    slug: "claude-haiku-3-5",
  },
  // Groq Models - Production
  "gemma2-9b-it": {
    id: "gemma2-9b-it",
    creator: "Google",
    metadata: {
      displayName: "Gemma 2 9B",
      description: "Google's Gemma 2 model optimized for Groq",
      contextWindow: 8192,
      releaseDate: "2024-01-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.2,
        },
      },
    },
    slug: "gemma2-9b",
  },
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3.1 8B Instant",
      description: "Fast Llama 3.1 model optimized for speed",
      contextWindow: 131072,
      releaseDate: "2024-07-23",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.05,
          completion_token: 0.08,
        },
      },
    },
    slug: "llama-3-1-8b-instant",
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3.3 70B Versatile",
      description: "Large versatile Llama model",
      contextWindow: 131072,
      maxOutputTokens: 32768,
      releaseDate: "2024-12-06",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.59,
          completion_token: 0.79,
        },
      },
    },
    slug: "llama-3-3-70b-versatile",
  },
  "meta-llama/llama-guard-4-12b": {
    id: "meta-llama/llama-guard-4-12b",
    creator: "Meta",
    metadata: {
      displayName: "Llama Guard 4 12B",
      description: "Safety-focused Llama model",
      contextWindow: 131072,
      maxOutputTokens: 1024,
      releaseDate: "2024-12-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.2,
        },
      },
    },
    slug: "llama-guard-4-12b",
  },
  // Groq Models - Preview
  "deepseek-r1-distill-llama-70b": {
    id: "deepseek-r1-distill-llama-70b",
    creator: "DeepSeek",
    metadata: {
      displayName: "DeepSeek R1 Distill Llama 70B",
      description: "DeepSeek's distilled Llama model",
      contextWindow: 131072,
      releaseDate: "2025-01-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.75,
          completion_token: 0.99,
        },
      },
    },
    slug: "deepseek-r1-distill-llama-70b",
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    creator: "Meta",
    metadata: {
      displayName: "Llama 4 Maverick 17B",
      description: "Llama 4 Maverick model with 128 experts",
      contextWindow: 131072,
      releaseDate: "2025-01-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.6,
        },
      },
    },
    slug: "llama-4-maverick-17b",
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    creator: "Meta",
    metadata: {
      displayName: "Llama 4 Scout 17B",
      description: "Llama 4 Scout model with 16 experts",
      contextWindow: 131072,
      releaseDate: "2025-01-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.11,
          completion_token: 0.34,
        },
      },
    },
    slug: "llama-4-scout-17b",
  },
  "moonshotai/kimi-k2-instruct": {
    id: "moonshotai/kimi-k2-instruct",
    creator: "Moonshot",
    metadata: {
      displayName: "Kimi K2 1T",
      description: "Moonshot's Kimi K2 model",
      contextWindow: 131072,
      releaseDate: "2025-01-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 1,
          completion_token: 3,
        },
      },
    },
    slug: "kimi-k2",
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    creator: "Alibaba",
    metadata: {
      displayName: "Qwen3 32B",
      description: "Alibaba's Qwen3 32B model",
      contextWindow: 131072,
      releaseDate: "2024-12-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.29,
          completion_token: 0.59,
        },
      },
    },
    slug: "qwen3-32b",
  },
  // Additional Groq models from pricing (need to match with models page IDs)
  "llama3-70b-8192": {
    id: "llama3-70b-8192",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3 70B",
      description: "Meta's Llama 3 70B model",
      contextWindow: 8192,
      releaseDate: "2024-04-18",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.59,
          completion_token: 0.79,
        },
      },
    },
    slug: "llama3-70b",
  },
  "llama3-8b-8192": {
    id: "llama3-8b-8192",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3 8B",
      description: "Meta's Llama 3 8B model",
      contextWindow: 8192,
      releaseDate: "2024-04-18",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.05,
          completion_token: 0.08,
        },
      },
    },
    slug: "llama3-8b",
  },
  "mixtral-8x7b-32768": {
    id: "mixtral-8x7b-32768",
    creator: "Mistral",
    metadata: {
      displayName: "Mistral Saba 24B",
      description: "Mistral's Saba model",
      contextWindow: 32768,
      releaseDate: "2024-12-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.79,
          completion_token: 0.79,
        },
      },
    },
    slug: "mistral-saba-24b",
  },
  "llama-guard-3-8b": {
    id: "llama-guard-3-8b",
    creator: "Meta",
    metadata: {
      displayName: "Llama Guard 3 8B",
      description: "Safety-focused Llama model",
      contextWindow: 8192,
      releaseDate: "2024-10-01",
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.2,
        },
      },
    },
    slug: "llama-guard-3-8b",
  },
  // x.ai Grok Models
  "grok-4-0709": {
    id: "grok-4-0709",
    creator: "xAI",
    metadata: {
      displayName: "Grok 4",
      description: "Most capable Grok model with extended context",
      contextWindow: 256000,
      releaseDate: "2024-07-09",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
        },
        rateLimit: {
          tpm: 2000000,
          rpm: 480,
        },
      },
    },
    slug: "grok-4",
  },
  "grok-3": {
    id: "grok-3",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3",
      description: "Advanced Grok model with strong capabilities",
      contextWindow: 131072,
      releaseDate: "2024-11-01",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
        },
        rateLimit: {
          rpm: 600,
        },
      },
    },
    slug: "grok-3",
  },
  "grok-3-mini": {
    id: "grok-3-mini",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Mini",
      description: "Smaller, efficient Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0.3,
          completion_token: 0.5,
        },
        rateLimit: {
          rpm: 480,
        },
      },
    },
    slug: "grok-3-mini",
  },
  "grok-3-fast": {
    id: "grok-3-fast",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Fast",
      description: "Speed-optimized Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 5,
          completion_token: 25,
        },
        rateLimit: {
          rpm: 600,
        },
        notes: "Available in us-east-1 and eu-west-1",
      },
    },
    slug: "grok-3-fast",
  },
  "grok-3-mini-fast": {
    id: "grok-3-mini-fast",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Mini Fast",
      description: "Speed-optimized mini Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0.6,
          completion_token: 4,
        },
        rateLimit: {
          rpm: 180,
        },
      },
    },
    slug: "grok-3-mini-fast",
  },
  "grok-2-vision-1212": {
    id: "grok-2-vision-1212",
    creator: "xAI",
    metadata: {
      displayName: "Grok 2 Vision",
      description: "Multimodal Grok model with vision capabilities",
      contextWindow: 32768,
      releaseDate: "2024-12-12",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 2,
          completion_token: 10,
        },
        rateLimit: {
          rpm: 600,
        },
        notes: "us-east-1: 600 rpm, eu-west-1: 50 rps",
      },
    },
    slug: "grok-2-vision",
  },
  "grok-2-image-1212": {
    id: "grok-2-image-1212",
    creator: "xAI",
    metadata: {
      displayName: "Grok 2 Image",
      description: "Image generation model",
      contextWindow: 0,
      releaseDate: "2024-12-12",
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0,
          completion_token: 0,
          per_image: 0.07,
        },
        rateLimit: {
          rpm: 300,
        },
      },
    },
    slug: "grok-2-image",
  },
  // Google Gemini Models
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    creator: "Google",
    metadata: {
      displayName: "Gemini 2.5 Pro",
      description: "Stable release (June 17th, 2025) of Gemini 2.5 Pro",
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-17",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 1.25, // $1.25 per 1M tokens (≤200k tokens), $2.50 per 1M tokens (>200k tokens)
          completion_token: 10, // $10 per 1M tokens (≤200k tokens), $15 per 1M tokens (>200k tokens)
        },
        modelString: "models/gemini-2.5-pro",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 1.25, // $1.25 per 1M tokens (≤200k tokens), $2.50 per 1M tokens (>200k tokens)
          completion_token: 10, // $10 per 1M tokens (≤200k tokens), $15 per 1M tokens (>200k tokens)
        },
      },
    },
    slug: "gemini-2-5-pro",
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    creator: "Google",
    metadata: {
      displayName: "Gemini 2.5 Flash",
      description:
        "Stable version of Gemini 2.5 Flash, our mid-size multimodal model that supports up to 1 million tokens",
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 0.3, // $0.30 per 1M tokens
          completion_token: 2.5, // $2.50 per 1M tokens
        },
        modelString: "models/gemini-2.5-flash",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 0.3, // $0.30 per 1M tokens
          completion_token: 2.5, // $2.50 per 1M tokens
        },
      },
    },
    slug: "gemini-2-5-flash",
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    creator: "Google",
    metadata: {
      displayName: "Gemini 2.5 Flash-Lite",
      description:
        "Stable version of Gemini 2.5 Flash-Lite, released in July of 2025",
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      releaseDate: "2025-07-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 0.1, // $0.10 per 1M tokens
          completion_token: 0.4, // $0.40 per 1M tokens
        },
        modelString: "models/gemini-2.5-flash-lite",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 0.1, // $0.10 per 1M tokens
          completion_token: 0.4, // $0.40 per 1M tokens
        },
      },
    },
    slug: "gemini-2-5-flash-lite",
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    creator: "Google",
    metadata: {
      displayName: "Gemini 2.0 Flash",
      description: "Gemini 2.0 Flash",
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      releaseDate: "2025-01-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 0.1, // $0.10 per 1M tokens
          completion_token: 0.4, // $0.40 per 1M tokens
        },
        modelString: "models/gemini-2.0-flash",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 0.1, // $0.10 per 1M tokens
          completion_token: 0.4, // $0.40 per 1M tokens
        },
      },
    },
    slug: "gemini-2-0-flash",
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    creator: "Google",
    metadata: {
      displayName: "Gemini 1.5 Pro",
      description:
        "Stable version of Gemini 1.5 Pro, our mid-size multimodal model that supports up to 2 million tokens",
      contextWindow: 2000000,
      maxOutputTokens: 8192,
      releaseDate: "2024-05-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 1.25, // $1.25 per 1M tokens (≤128k tokens), $2.50 per 1M tokens (>128k tokens)
          completion_token: 5, // $5.00 per 1M tokens (≤128k tokens), $10.00 per 1M tokens (>128k tokens)
        },
        modelString: "models/gemini-1.5-pro",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 1.25, // $1.25 per 1M tokens (≤128k tokens), $2.50 per 1M tokens (>128k tokens)
          completion_token: 5, // $5.00 per 1M tokens (≤128k tokens), $10.00 per 1M tokens (>128k tokens)
        },
      },
    },
    slug: "gemini-1-5-pro",
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    creator: "Google",
    metadata: {
      displayName: "Gemini 1.5 Flash",
      description:
        "Alias that points to the most recent stable version of Gemini 1.5 Flash",
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      releaseDate: "2024-05-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 0.075, // $0.075 per 1M tokens (≤128k tokens), $0.15 per 1M tokens (>128k tokens)
          completion_token: 0.3, // $0.30 per 1M tokens (≤128k tokens), $0.60 per 1M tokens (>128k tokens)
        },
        modelString: "models/gemini-1.5-flash",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 0.075, // $0.075 per 1M tokens (≤128k tokens), $0.15 per 1M tokens (>128k tokens)
          completion_token: 0.3, // $0.30 per 1M tokens (≤128k tokens), $0.60 per 1M tokens (>128k tokens)
        },
      },
    },
    slug: "gemini-1-5-flash",
  },
  "gemini-1.5-flash-8b": {
    id: "gemini-1.5-flash-8b",
    creator: "Google",
    metadata: {
      displayName: "Gemini 1.5 Flash-8B",
      description:
        "Stable version of Gemini 1.5 Flash-8B, our smallest and most cost effective Flash model",
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      releaseDate: "2024-10-01",
    },
    providers: {
      "google-ai": {
        provider: "google-ai",
        available: true,
        cost: {
          prompt_token: 0.0375, // $0.0375 per 1M tokens (≤128k tokens), $0.075 per 1M tokens (>128k tokens)
          completion_token: 0.15, // $0.15 per 1M tokens (≤128k tokens), $0.30 per 1M tokens (>128k tokens)
        },
        modelString: "models/gemini-1.5-flash-8b",
      },
      "google-vertex-ai": {
        provider: "google-vertex-ai",
        available: true,
        cost: {
          prompt_token: 0.0375, // $0.0375 per 1M tokens (≤128k tokens), $0.075 per 1M tokens (>128k tokens)
          completion_token: 0.15, // $0.15 per 1M tokens (≤128k tokens), $0.30 per 1M tokens (>128k tokens)
        },
      },
    },
    slug: "gemini-1-5-flash-8b",
  },
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;
