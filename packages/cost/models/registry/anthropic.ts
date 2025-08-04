/**
 * Anthropic model definitions
 * Auto-generated on: 2025-08-04T04:52:42.850Z
 */

import type { BaseModel } from "../types";

export const anthropicModels = {
  "claude-3-5-haiku-20241022": {
    id: "claude-3-5-haiku-20241022",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Haiku 3.5",
      description: "Fast and efficient Claude model for routine tasks",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      releaseDate: "2024-10-22"
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 0.8,
          completion_token: 4,
          prompt_cache_write_token: 1,
          prompt_cache_read_token: 0.08,
          prompt_cache_write_token_1hr: 1.6
        }
      }
    },
    slug: "claude-haiku-3-5"
  },
  "claude-3-5-sonnet-20241022": {
    id: "claude-3-5-sonnet-20241022",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 3.5",
      description: "High level of intelligence and capability",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      releaseDate: "2024-10-22"
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75,
          prompt_cache_read_token: 0.3,
          prompt_cache_write_token_1hr: 6
        }
      }
    },
    slug: "claude-sonnet-3-5"
  },
  "claude-3-7-sonnet-20250219": {
    id: "claude-3-7-sonnet-20250219",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 3.7",
      description: "Advanced Sonnet model with extended thinking",
      contextWindow: 200000,
      maxOutputTokens: 64000,
      releaseDate: "2025-02-19"
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75,
          prompt_cache_read_token: 0.3,
          prompt_cache_write_token_1hr: 6
        }
      }
    },
    slug: "claude-sonnet-3-7"
  },
  "claude-opus-4-20250514": {
    id: "claude-opus-4-20250514",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Opus 4",
      description: "Most capable Claude model with extended thinking capabilities",
      contextWindow: 200000,
      maxOutputTokens: 32000,
      releaseDate: "2025-05-14"
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 15,
          completion_token: 75,
          prompt_cache_write_token: 0.00001875,
          prompt_cache_read_token: 0.0000015,
          prompt_cache_write_token_1hr: 0.00003
        }
      }
    },
    slug: "claude-opus-4"
  },
  "claude-sonnet-4-20250514": {
    id: "claude-sonnet-4-20250514",
    creator: "Anthropic",
    metadata: {
      displayName: "Claude Sonnet 4",
      description: "Balanced Claude model with excellent performance and value",
      contextWindow: 200000,
      maxOutputTokens: 64000,
      releaseDate: "2025-05-14"
    },
    providers: {
      anthropic: {
        provider: "anthropic",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15,
          prompt_cache_write_token: 3.75,
          prompt_cache_read_token: 0.3,
          prompt_cache_write_token_1hr: 6
        }
      }
    },
    slug: "claude-sonnet-4"
  }
} satisfies Record<string, BaseModel>;
