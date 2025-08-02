/**
 * Base model definitions
 * Auto-generated on: ${new Date().toISOString()}
 * Total base models: 33
 */

import type { BaseModel } from "../types";

export const baseModels = {
  // GPT-4.1 Series (New)
  "gpt-4.1": {
    id: "gpt-4.1",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1",
      description: "Latest generation model with improved performance",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000002,
          completion_token: 0.000008,
          prompt_cache_read_token: 0.0000005
        },
        modelString: "gpt-4.1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1"
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1 Mini",
      description: "Smaller, faster variant of GPT-4.1",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000004,
          completion_token: 0.0000016,
          prompt_cache_read_token: 0.0000001
        },
        modelString: "gpt-4.1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1-mini"
  },
  "gpt-4.1-nano": {
    id: "gpt-4.1-nano",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.1 Nano",
      description: "Smallest and fastest GPT-4.1 variant",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-04-14"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000001,
          completion_token: 0.0000004,
          prompt_cache_read_token: 0.000000025
        },
        modelString: "gpt-4.1-nano",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1-nano"
  },
  
  // GPT-4.5 Preview
  "gpt-4.5-preview": {
    id: "gpt-4.5-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4.5 Preview",
      description: "Preview of next major GPT release",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-02-27"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000075,
          completion_token: 0.00015,
          prompt_cache_read_token: 0.0000375
        },
        modelString: "gpt-4.5-preview",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "gpt-4.5-preview"
  },

  // GPT-4o Series
  "gpt-4o": {
    id: "gpt-4o",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o",
      description: "OpenAI's most advanced multimodal model, 2x faster and 50% cheaper than GPT-4 Turbo",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-05-13"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000025,
          completion_token: 0.00001,
          prompt_cache_read_token: 0.00000125
        },
        modelString: "gpt-4o",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4o"
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Mini",
      description: "Affordable small model for fast, lightweight tasks",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-07-18"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00000015,
          completion_token: 0.0000006,
          prompt_cache_read_token: 0.000000075
        },
        modelString: "gpt-4o-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4o-mini"
  },
  
  // O Series (Reasoning Models)
  "o1": {
    id: "o1",
    creator: "OpenAI",
    metadata: {
      displayName: "O1",
      description: "Reasoning model for complex tasks",
      contextWindow: 200000,
      maxOutputTokens: 100000,
      releaseDate: "2024-12-17"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000015,
          completion_token: 0.00006,
          prompt_cache_read_token: 0.0000075
        },
        modelString: "o1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000000
        }
      }
    },
    slug: "o1"
  },
  "o1-pro": {
    id: "o1-pro",
    creator: "OpenAI",
    metadata: {
      displayName: "O1 Pro",
      description: "Premium reasoning model for the most complex tasks",
      contextWindow: 200000,
      maxOutputTokens: 100000,
      releaseDate: "2025-03-19"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00015,
          completion_token: 0.0006
        },
        modelString: "o1-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "o1-pro"
  },
  "o1-mini": {
    id: "o1-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O1 Mini",
      description: "Faster reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2024-09-12"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000011,
          completion_token: 0.0000044,
          prompt_cache_read_token: 0.00000055
        },
        modelString: "o1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o1-mini"
  },
  
  // O3 Series
  "o3": {
    id: "o3",
    creator: "OpenAI",
    metadata: {
      displayName: "O3",
      description: "Advanced reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-04-16"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000002,
          completion_token: 0.000008,
          prompt_cache_read_token: 0.0000005
        },
        modelString: "o3",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o3"
  },
  "o3-pro": {
    id: "o3-pro",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Pro",
      description: "Premium O3 model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-10"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00002,
          completion_token: 0.00008
        },
        modelString: "o3-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "o3-pro"
  },
  "o3-deep-research": {
    id: "o3-deep-research",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Deep Research",
      description: "Specialized model for deep research tasks",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-26"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00001,
          completion_token: 0.00004,
          prompt_cache_read_token: 0.0000025
        },
        modelString: "o3-deep-research",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o3-deep-research"
  },
  "o3-mini": {
    id: "o3-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O3 Mini",
      description: "Smaller O3 variant",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-01-31"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000011,
          completion_token: 0.0000044,
          prompt_cache_read_token: 0.00000055
        },
        modelString: "o3-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o3-mini"
  },
  
  // O4 Series
  "o4-mini": {
    id: "o4-mini",
    creator: "OpenAI",
    metadata: {
      displayName: "O4 Mini",
      description: "Latest mini reasoning model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-04-16"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000011,
          completion_token: 0.0000044,
          prompt_cache_read_token: 0.000000275
        },
        modelString: "o4-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o4-mini"
  },
  "o4-mini-deep-research": {
    id: "o4-mini-deep-research",
    creator: "OpenAI",
    metadata: {
      displayName: "O4 Mini Deep Research",
      description: "Smaller deep research model",
      contextWindow: 128000,
      maxOutputTokens: 65536,
      releaseDate: "2025-06-26"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000002,
          completion_token: 0.000008,
          prompt_cache_read_token: 0.0000005
        },
        modelString: "o4-mini-deep-research",
        rateLimit: {
          tpm: 150000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o4-mini-deep-research"
  },

  // Specialized Models
  "codex-mini-latest": {
    id: "codex-mini-latest",
    creator: "OpenAI",
    metadata: {
      displayName: "Codex Mini Latest",
      description: "Code-optimized model",
      contextWindow: 8192,
      maxOutputTokens: 4096,
      releaseDate: "2025-01-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000015,
          completion_token: 0.000006,
          prompt_cache_read_token: 0.000000375
        },
        modelString: "codex-mini-latest",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "codex-mini-latest"
  },
  "gpt-4o-mini-search-preview": {
    id: "gpt-4o-mini-search-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Mini Search Preview",
      description: "Search-optimized mini model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-03-11"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00000015,
          completion_token: 0.0000006
        },
        modelString: "gpt-4o-mini-search-preview",
        rateLimit: {
          tpm: 3000000,
          rpm: 1000
        }
      }
    },
    slug: "gpt-4o-mini-search-preview"
  },
  "gpt-4o-search-preview": {
    id: "gpt-4o-search-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Search Preview",
      description: "Search-optimized model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-03-11"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000025,
          completion_token: 0.00001
        },
        modelString: "gpt-4o-search-preview",
        rateLimit: {
          tpm: 3000000,
          rpm: 1000
        }
      }
    },
    slug: "gpt-4o-search-preview"
  },
  "computer-use-preview": {
    id: "computer-use-preview",
    creator: "OpenAI",
    metadata: {
      displayName: "Computer Use Preview",
      description: "Model for computer interaction tasks",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-03-11"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000003,
          completion_token: 0.000012
        },
        modelString: "computer-use-preview",
        rateLimit: {
          tpm: 20000000,
          rpm: 3000,
          tpd: 450000000
        }
      }
    },
    slug: "computer-use-preview"
  },
  "gpt-image-1": {
    id: "gpt-image-1",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT Image 1",
      description: "Multimodal model with image understanding",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2025-01-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0,
          prompt_cache_read_token: 0.00000125
        },
        modelString: "gpt-image-1",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "gpt-image-1"
  },

  // GPT-3.5 Series
  "gpt-3.5-turbo": {
    id: "gpt-3.5-turbo",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo",
      description: "Fast, inexpensive model for simple tasks",
      contextWindow: 16385,
      maxOutputTokens: 4096,
      releaseDate: "2023-06-13"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000005,
          completion_token: 0.0000015
        },
        modelString: "gpt-3.5-turbo",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "gpt-3.5-turbo"
  },
  "gpt-3.5-turbo-instruct": {
    id: "gpt-3.5-turbo-instruct",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo Instruct",
      description: "Instruct-tuned version of GPT-3.5",
      contextWindow: 4096,
      maxOutputTokens: 4096,
      releaseDate: "2023-09-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000015,
          completion_token: 0.000002
        },
        modelString: "gpt-3.5-turbo-instruct",
        rateLimit: {
          tpm: 90000,
          rpm: 3500,
          tpd: 200000
        }
      }
    },
    slug: "gpt-3.5-turbo-instruct"
  },
  "gpt-3.5-turbo-16k": {
    id: "gpt-3.5-turbo-16k",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-3.5 Turbo 16K",
      description: "Extended context version of GPT-3.5",
      contextWindow: 16385,
      maxOutputTokens: 4096,
      releaseDate: "2023-06-13"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000003,
          completion_token: 0.000004
        },
        modelString: "gpt-3.5-turbo-16k",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "gpt-3.5-turbo-16k"
  },

  // Legacy GPT-4
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4 Turbo",
      description: "Previous generation GPT-4 with 128K context",
      contextWindow: 128000,
      maxOutputTokens: 4096,
      releaseDate: "2024-04-09"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00001,
          completion_token: 0.00003
        },
        modelString: "gpt-4-turbo",
        rateLimit: {
          tpm: 2000000,
          rpm: 10000,
          tpd: 300000000
        }
      }
    },
    slug: "gpt-4-turbo"
  },
  "gpt-4": {
    id: "gpt-4",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4",
      description: "Original GPT-4 model",
      contextWindow: 8192,
      maxOutputTokens: 4096,
      releaseDate: "2023-03-14"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00003,
          completion_token: 0.00006
        },
        modelString: "gpt-4",
        rateLimit: {
          tpm: 1000000,
          rpm: 10000,
          tpd: 150000000
        }
      }
    },
    slug: "gpt-4"
  },
  "gpt-4-32k": {
    id: "gpt-4-32k",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4 32K",
      description: "Extended context GPT-4",
      contextWindow: 32768,
      maxOutputTokens: 4096,
      releaseDate: "2023-03-14"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00006,
          completion_token: 0.00012
        },
        modelString: "gpt-4-32k",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "gpt-4-32k"
  },
  "chatgpt-4o-latest": {
    id: "chatgpt-4o-latest",
    creator: "OpenAI",
    metadata: {
      displayName: "ChatGPT 4o Latest",
      description: "Latest ChatGPT model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-08-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0.000015
        },
        modelString: "chatgpt-4o-latest",
        rateLimit: {
          tpm: 500000,
          rpm: 200
        }
      }
    },
    slug: "chatgpt-4o-latest"
  },

  // Legacy Models
  "davinci-002": {
    id: "davinci-002",
    creator: "OpenAI",
    metadata: {
      displayName: "Davinci 002",
      description: "Legacy GPT-3 model",
      contextWindow: 16384,
      maxOutputTokens: 4096,
      releaseDate: "2022-04-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000002,
          completion_token: 0.000002
        },
        modelString: "davinci-002",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "davinci-002"
  },
  "babbage-002": {
    id: "babbage-002",
    creator: "OpenAI",
    metadata: {
      displayName: "Babbage 002",
      description: "Smaller legacy GPT-3 model",
      contextWindow: 16384,
      maxOutputTokens: 4096,
      releaseDate: "2022-04-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000004,
          completion_token: 0.0000004
        },
        modelString: "babbage-002",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "babbage-002"
  },

  // TTS Models (for completeness)
  "gpt-4o-mini-tts": {
    id: "gpt-4o-mini-tts",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Mini TTS",
      description: "Text-to-speech model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-12-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000006,
          completion_token: 0
        },
        modelString: "gpt-4o-mini-tts",
        rateLimit: {
          tpm: 8000000,
          rpm: 10000
        }
      }
    },
    slug: "gpt-4o-mini-tts"
  },
  "gpt-4o-transcribe": {
    id: "gpt-4o-transcribe",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Transcribe",
      description: "Speech-to-text model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-12-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000025,
          completion_token: 0.00001
        },
        modelString: "gpt-4o-transcribe",
        rateLimit: {
          tpm: 6000000,
          rpm: 10000
        }
      }
    },
    slug: "gpt-4o-transcribe"
  },
  "gpt-4o-mini-transcribe": {
    id: "gpt-4o-mini-transcribe",
    creator: "OpenAI",
    metadata: {
      displayName: "GPT-4o Mini Transcribe",
      description: "Smaller speech-to-text model",
      contextWindow: 128000,
      maxOutputTokens: 16384,
      releaseDate: "2024-12-01"
    },
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.00000125,
          completion_token: 0.000005
        },
        modelString: "gpt-4o-mini-transcribe",
        rateLimit: {
          tpm: 8000000,
          rpm: 10000
        }
      }
    },
    slug: "gpt-4o-mini-transcribe"
  }
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;