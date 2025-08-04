/**
 * Meta model definitions
 * Auto-generated on: 2025-08-04T04:52:42.850Z
 */

import type { BaseModel } from "../types";

export const metaModels = {
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3.1 8B Instant",
      description: "Fast Llama 3.1 model optimized for speed",
      contextWindow: 131072,
      releaseDate: "2024-07-23"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.05,
          completion_token: 0.08
        }
      }
    },
    slug: "llama-3-1-8b-instant"
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3.3 70B Versatile",
      description: "Large versatile Llama model",
      contextWindow: 131072,
      maxOutputTokens: 32768,
      releaseDate: "2024-12-06"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.59,
          completion_token: 0.79
        }
      }
    },
    slug: "llama-3-3-70b-versatile"
  },
  "llama-guard-3-8b": {
    id: "llama-guard-3-8b",
    creator: "Meta",
    metadata: {
      displayName: "Llama Guard 3 8B",
      description: "Safety-focused Llama model",
      contextWindow: 8192,
      releaseDate: "2024-10-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.2
        }
      }
    },
    slug: "llama-guard-3-8b"
  },
  "llama3-70b-8192": {
    id: "llama3-70b-8192",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3 70B",
      description: "Meta's Llama 3 70B model",
      contextWindow: 8192,
      releaseDate: "2024-04-18"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.59,
          completion_token: 0.79
        }
      }
    },
    slug: "llama3-70b"
  },
  "llama3-8b-8192": {
    id: "llama3-8b-8192",
    creator: "Meta",
    metadata: {
      displayName: "Llama 3 8B",
      description: "Meta's Llama 3 8B model",
      contextWindow: 8192,
      releaseDate: "2024-04-18"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.05,
          completion_token: 0.08
        }
      }
    },
    slug: "llama3-8b"
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    creator: "Meta",
    metadata: {
      displayName: "Llama 4 Maverick 17B",
      description: "Llama 4 Maverick model with 128 experts",
      contextWindow: 131072,
      releaseDate: "2025-01-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.6
        }
      }
    },
    slug: "llama-4-maverick-17b"
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    creator: "Meta",
    metadata: {
      displayName: "Llama 4 Scout 17B",
      description: "Llama 4 Scout model with 16 experts",
      contextWindow: 131072,
      releaseDate: "2025-01-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.11,
          completion_token: 0.34
        }
      }
    },
    slug: "llama-4-scout-17b"
  },
  "meta-llama/llama-guard-4-12b": {
    id: "meta-llama/llama-guard-4-12b",
    creator: "Meta",
    metadata: {
      displayName: "Llama Guard 4 12B",
      description: "Safety-focused Llama model",
      contextWindow: 131072,
      maxOutputTokens: 1024,
      releaseDate: "2024-12-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.2,
          completion_token: 0.2
        }
      }
    },
    slug: "llama-guard-4-12b"
  }
} satisfies Record<string, BaseModel>;
