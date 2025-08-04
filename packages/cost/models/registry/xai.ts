/**
 * xAI model definitions
 * Auto-generated on: 2025-08-04T04:52:42.851Z
 */

import type { BaseModel } from "../types";

export const xaiModels = {
  "grok-2-vision-1212": {
    id: "grok-2-vision-1212",
    creator: "xAI",
    metadata: {
      displayName: "Grok 2 Vision",
      description: "Multimodal Grok model with vision capabilities",
      contextWindow: 32768,
      releaseDate: "2024-12-12"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 2,
          completion_token: 10
        },
        notes: "us-east-1: 600 rpm, eu-west-1: 50 rps",
        rateLimit: {
          rpm: 600
        }
      }
    },
    slug: "grok-2-vision"
  },
  "grok-3": {
    id: "grok-3",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3",
      description: "Advanced Grok model with strong capabilities",
      contextWindow: 131072,
      releaseDate: "2024-11-01"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15
        },
        rateLimit: {
          rpm: 600
        }
      }
    },
    slug: "grok-3"
  },
  "grok-3-fast": {
    id: "grok-3-fast",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Fast",
      description: "Speed-optimized Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 5,
          completion_token: 25
        },
        notes: "Available in us-east-1 and eu-west-1",
        rateLimit: {
          rpm: 600
        }
      }
    },
    slug: "grok-3-fast"
  },
  "grok-3-mini": {
    id: "grok-3-mini",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Mini",
      description: "Smaller, efficient Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0.3,
          completion_token: 0.5
        },
        rateLimit: {
          rpm: 480
        }
      }
    },
    slug: "grok-3-mini"
  },
  "grok-3-mini-fast": {
    id: "grok-3-mini-fast",
    creator: "xAI",
    metadata: {
      displayName: "Grok 3 Mini Fast",
      description: "Speed-optimized mini Grok model",
      contextWindow: 131072,
      releaseDate: "2024-11-01"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0.6,
          completion_token: 4
        },
        rateLimit: {
          rpm: 180
        }
      }
    },
    slug: "grok-3-mini-fast"
  },
  "grok-4-0709": {
    id: "grok-4-0709",
    creator: "xAI",
    metadata: {
      displayName: "Grok 4",
      description: "Most capable Grok model with extended context",
      contextWindow: 256000,
      releaseDate: "2024-07-09"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 3,
          completion_token: 15
        },
        rateLimit: {
          tpm: 2000000,
          rpm: 480
        }
      }
    },
    slug: "grok-4"
  }
} satisfies Record<string, BaseModel>;
