/**
 * Google model definitions
 * Contains all models created by Google
 * Auto-generated on: 2025-08-04T02:18:27.177Z
 * Total models: 8
 */

import type { BaseModel } from "../types";

export const googleModels = {
  "gemini-1.5-flash": {
  id: "gemini-1.5-flash",
  creator: "Google",
  metadata: {
    displayName: "Gemini 1.5 Flash",
    description: "Alias that points to the most recent stable version of Gemini 1.5 Flash",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    releaseDate: "2024-05-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 0.075,
        completion_token: 0.3
      },
      modelString: "models/gemini-1.5-flash"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 0.075,
        completion_token: 0.3
      }
    }
  },
  slug: "gemini-1-5-flash"
},
  "gemini-1.5-flash-8b": {
  id: "gemini-1.5-flash-8b",
  creator: "Google",
  metadata: {
    displayName: "Gemini 1.5 Flash-8B",
    description: "Stable version of Gemini 1.5 Flash-8B, our smallest and most cost effective Flash model",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    releaseDate: "2024-10-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 0.0375,
        completion_token: 0.15
      },
      modelString: "models/gemini-1.5-flash-8b"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 0.0375,
        completion_token: 0.15
      }
    }
  },
  slug: "gemini-1-5-flash-8b"
},
  "gemini-1.5-pro": {
  id: "gemini-1.5-pro",
  creator: "Google",
  metadata: {
    displayName: "Gemini 1.5 Pro",
    description: "Stable version of Gemini 1.5 Pro, our mid-size multimodal model that supports up to 2 million tokens",
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    releaseDate: "2024-05-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 1.25,
        completion_token: 5
      },
      modelString: "models/gemini-1.5-pro"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 1.25,
        completion_token: 5
      }
    }
  },
  slug: "gemini-1-5-pro"
},
  "gemini-2.0-flash": {
  id: "gemini-2.0-flash",
  creator: "Google",
  metadata: {
    displayName: "Gemini 2.0 Flash",
    description: "Gemini 2.0 Flash",
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    releaseDate: "2025-01-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 0.1,
        completion_token: 0.4
      },
      modelString: "models/gemini-2.0-flash"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 0.1,
        completion_token: 0.4
      }
    }
  },
  slug: "gemini-2-0-flash"
},
  "gemini-2.5-flash": {
  id: "gemini-2.5-flash",
  creator: "Google",
  metadata: {
    displayName: "Gemini 2.5 Flash",
    description: "Stable version of Gemini 2.5 Flash, our mid-size multimodal model that supports up to 1 million tokens",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    releaseDate: "2025-06-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 0.3,
        completion_token: 2.5
      },
      modelString: "models/gemini-2.5-flash"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 0.3,
        completion_token: 2.5
      }
    }
  },
  slug: "gemini-2-5-flash"
},
  "gemini-2.5-flash-lite": {
  id: "gemini-2.5-flash-lite",
  creator: "Google",
  metadata: {
    displayName: "Gemini 2.5 Flash-Lite",
    description: "Stable version of Gemini 2.5 Flash-Lite, released in July of 2025",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    releaseDate: "2025-07-01"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 0.1,
        completion_token: 0.4
      },
      modelString: "models/gemini-2.5-flash-lite"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 0.1,
        completion_token: 0.4
      }
    }
  },
  slug: "gemini-2-5-flash-lite"
},
  "gemini-2.5-pro": {
  id: "gemini-2.5-pro",
  creator: "Google",
  metadata: {
    displayName: "Gemini 2.5 Pro",
    description: "Stable release (June 17th, 2025) of Gemini 2.5 Pro",
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    releaseDate: "2025-06-17"
  },
  providers: {
    "google-ai": {
      provider: "google-ai",
      available: true,
      cost: {
        prompt_token: 1.25,
        completion_token: 10
      },
      modelString: "models/gemini-2.5-pro"
    },
    "google-vertex-ai": {
      provider: "google-vertex-ai",
      available: true,
      cost: {
        prompt_token: 1.25,
        completion_token: 10
      }
    }
  },
  slug: "gemini-2-5-pro"
},
  "gemma2-9b-it": {
  id: "gemma2-9b-it",
  creator: "Google",
  metadata: {
    displayName: "Gemma 2 9B",
    description: "Google's Gemma 2 model optimized for Groq",
    contextWindow: 8192,
    releaseDate: "2024-01-01"
  },
  providers: {
    "groq": {
      provider: "groq",
      available: true,
      cost: {
        prompt_token: 0.2,
        completion_token: 0.2
      }
    }
  },
  slug: "gemma2-9b"
},
} satisfies Record<string, BaseModel>;
