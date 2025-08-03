/**
 * Base model definitions
 * Auto-generated on: 2025-08-03T05:49:23.186Z
 * Total base models: 32
 */

import type { BaseModel } from "../types";

export const baseModels = {
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
      available: false,
      cost: {
        prompt_token: 4e-7,
        completion_token: 4e-7
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
      available: false,
      cost: {
        prompt_token: 0.0000015,
        completion_token: 0.000006,
        prompt_cache_read_token: 3.75e-7
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
      available: false,
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
      available: false,
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
        prompt_token: 5e-7,
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
        prompt_cache_read_token: 5e-7
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
        prompt_token: 4e-7,
        completion_token: 0.0000016,
        prompt_cache_read_token: 1e-7
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
        prompt_token: 1e-7,
        completion_token: 4e-7,
        prompt_cache_read_token: 2.5e-8
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
        prompt_token: 1.5e-7,
        completion_token: 6e-7,
        prompt_cache_read_token: 7.5e-8
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
  "gpt-4o-mini-search-preview": {
  id: "gpt-4o-mini-search-preview",
  creator: "OpenAI",
  disabled: true,
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
        prompt_token: 1.5e-7,
        completion_token: 6e-7
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
  "gpt-4o-mini-transcribe": {
  id: "gpt-4o-mini-transcribe",
  creator: "OpenAI",
  disabled: true,
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
},
  "gpt-4o-mini-tts": {
  id: "gpt-4o-mini-tts",
  creator: "OpenAI",
  disabled: true,
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
        prompt_token: 6e-7,
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
  "gpt-4o-transcribe": {
  id: "gpt-4o-transcribe",
  creator: "OpenAI",
  disabled: true,
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
  "gpt-image-1": {
  id: "gpt-image-1",
  creator: "OpenAI",
  disabled: true,
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
        prompt_cache_read_token: 5.5e-7
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
        prompt_cache_read_token: 5e-7
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
        prompt_cache_read_token: 5.5e-7
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
        prompt_cache_read_token: 2.75e-7
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
        prompt_cache_read_token: 5e-7
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
  // Anthropic Models
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
          prompt_token: 0.000015,
          completion_token: 0.000075,
          prompt_cache_write_token: 0.00001875, // 5min cache
          prompt_cache_write_token_1hr: 0.00003, // 1hr cache
          prompt_cache_read_token: 0.0000015
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
          prompt_token: 0.000003,
          completion_token: 0.000015,
          prompt_cache_write_token: 0.00000375, // 5min cache
          prompt_cache_write_token_1hr: 0.000006, // 1hr cache
          prompt_cache_read_token: 0.0000003
        }
      }
    },
    slug: "claude-sonnet-4"
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
          prompt_token: 0.000003,
          completion_token: 0.000015,
          prompt_cache_write_token: 0.00000375, // 5min cache
          prompt_cache_write_token_1hr: 0.000006, // 1hr cache
          prompt_cache_read_token: 0.0000003
        }
      }
    },
    slug: "claude-sonnet-3-7"
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
          prompt_token: 0.000003,
          completion_token: 0.000015,
          prompt_cache_write_token: 0.00000375, // 5min cache
          prompt_cache_write_token_1hr: 0.000006, // 1hr cache
          prompt_cache_read_token: 0.0000003
        }
      }
    },
    slug: "claude-sonnet-3-5"
  },
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
          prompt_token: 0.0000008,
          completion_token: 0.000004,
          prompt_cache_write_token: 0.000001, // 5min cache
          prompt_cache_write_token_1hr: 0.0000016, // 1hr cache
          prompt_cache_read_token: 0.00000008
        }
      }
    },
    slug: "claude-haiku-3-5"
  },
  // Groq Models - Production
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
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.0000002,
          completion_token: 0.0000002
        }
      }
    },
    slug: "gemma2-9b"
  },
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
          prompt_token: 0.00000005,
          completion_token: 0.00000008
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
          prompt_token: 0.00000059,
          completion_token: 0.00000079
        }
      }
    },
    slug: "llama-3-3-70b-versatile"
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
          prompt_token: 0.0000002,
          completion_token: 0.0000002
        }
      }
    },
    slug: "llama-guard-4-12b"
  },
  // Groq Models - Preview
  "deepseek-r1-distill-llama-70b": {
    id: "deepseek-r1-distill-llama-70b",
    creator: "DeepSeek",
    metadata: {
      displayName: "DeepSeek R1 Distill Llama 70B",
      description: "DeepSeek's distilled Llama model",
      contextWindow: 131072,
      releaseDate: "2025-01-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.00000075,
          completion_token: 0.00000099
        }
      }
    },
    slug: "deepseek-r1-distill-llama-70b"
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
          prompt_token: 0.0000002,
          completion_token: 0.0000006
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
          prompt_token: 0.00000011,
          completion_token: 0.00000034
        }
      }
    },
    slug: "llama-4-scout-17b"
  },
  "moonshotai/kimi-k2-instruct": {
    id: "moonshotai/kimi-k2-instruct",
    creator: "Moonshot",
    metadata: {
      displayName: "Kimi K2 1T",
      description: "Moonshot's Kimi K2 model",
      contextWindow: 131072,
      releaseDate: "2025-01-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.000001,
          completion_token: 0.000003
        }
      }
    },
    slug: "kimi-k2"
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    creator: "Alibaba",
    metadata: {
      displayName: "Qwen3 32B",
      description: "Alibaba's Qwen3 32B model",
      contextWindow: 131072,
      releaseDate: "2024-12-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.00000029,
          completion_token: 0.00000059
        }
      }
    },
    slug: "qwen3-32b"
  },
  // Additional Groq models from pricing (need to match with models page IDs)
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
          prompt_token: 0.00000059,
          completion_token: 0.00000079
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
          prompt_token: 0.00000005,
          completion_token: 0.00000008
        }
      }
    },
    slug: "llama3-8b"
  },
  "mixtral-8x7b-32768": {
    id: "mixtral-8x7b-32768",
    creator: "Mistral",
    metadata: {
      displayName: "Mistral Saba 24B",
      description: "Mistral's Saba model",
      contextWindow: 32768,
      releaseDate: "2024-12-01"
    },
    providers: {
      groq: {
        provider: "groq",
        available: true,
        cost: {
          prompt_token: 0.00000079,
          completion_token: 0.00000079
        }
      }
    },
    slug: "mistral-saba-24b"
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
          prompt_token: 0.0000002,
          completion_token: 0.0000002
        }
      }
    },
    slug: "llama-guard-3-8b"
  },
  // x.ai Grok Models
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
          prompt_token: 0.000003,
          completion_token: 0.000015
        },
        rateLimit: {
          tpm: 2000000,
          rpm: 480
        }
      }
    },
    slug: "grok-4"
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
          prompt_token: 0.000003,
          completion_token: 0.000015
        },
        rateLimit: {
          rpm: 600
        }
      }
    },
    slug: "grok-3"
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
          prompt_token: 0.0000003,
          completion_token: 0.0000005
        },
        rateLimit: {
          rpm: 480
        }
      }
    },
    slug: "grok-3-mini"
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
          prompt_token: 0.000005,
          completion_token: 0.000025
        },
        rateLimit: {
          rpm: 600
        },
        notes: "Available in us-east-1 and eu-west-1"
      }
    },
    slug: "grok-3-fast"
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
          prompt_token: 0.0000006,
          completion_token: 0.000004
        },
        rateLimit: {
          rpm: 180
        }
      }
    },
    slug: "grok-3-mini-fast"
  },
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
          prompt_token: 0.000002,
          completion_token: 0.00001
        },
        rateLimit: {
          rpm: 600
        },
        notes: "us-east-1: 600 rpm, eu-west-1: 50 rps"
      }
    },
    slug: "grok-2-vision"
  },
  "grok-2-image-1212": {
    id: "grok-2-image-1212",
    creator: "xAI",
    metadata: {
      displayName: "Grok 2 Image",
      description: "Image generation model",
      contextWindow: 0,
      releaseDate: "2024-12-12"
    },
    providers: {
      xAI: {
        provider: "xAI",
        available: true,
        cost: {
          prompt_token: 0,
          completion_token: 0,
          per_image: 0.07
        },
        rateLimit: {
          rpm: 300
        }
      }
    },
    slug: "grok-2-image"
  },
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;
