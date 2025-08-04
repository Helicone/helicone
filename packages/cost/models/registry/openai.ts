/**
 * OpenAI model definitions
 * Auto-generated on: 2025-08-04T04:52:42.850Z
 */

import type { BaseModel } from "../types";

export const openaiModels = {
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
          prompt_token: 5,
          completion_token: 15
        },
        modelString: "chatgpt-4o-latest",
        rateLimit: {
          tpm: 500000,
          rpm: 200
        }
      }
    },
    slug: "chatgpt-4o-latest",
    disabled: false
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
          prompt_token: 0.5,
          completion_token: 1.5
        },
        modelString: "gpt-3.5-turbo",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "gpt-3.5-turbo",
    variants: {
      "gpt-3.5-turbo-0125": {
        id: "gpt-3.5-turbo-0125"
      }
    }
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
          prompt_token: 3,
          completion_token: 4
        },
        modelString: "gpt-3.5-turbo-16k",
        rateLimit: {
          tpm: 50000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "gpt-3.5-turbo-16k",
    variants: {
      "gpt-3.5-turbo-16k-0613": {
        id: "gpt-3.5-turbo-16k-0613"
      }
    }
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
          prompt_token: 1.5,
          completion_token: 2
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
          prompt_token: 30,
          completion_token: 60
        },
        modelString: "gpt-4",
        rateLimit: {
          tpm: 1000000,
          rpm: 10000,
          tpd: 150000000
        }
      }
    },
    slug: "gpt-4",
    variants: {
      "gpt-4-0613": {
        id: "gpt-4-0613"
      }
    }
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
          prompt_token: 60,
          completion_token: 120
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
          prompt_token: 10,
          completion_token: 30
        },
        modelString: "gpt-4-turbo",
        rateLimit: {
          tpm: 2000000,
          rpm: 10000,
          tpd: 300000000
        }
      }
    },
    slug: "gpt-4-turbo",
    variants: {
      "gpt-4-turbo-2024-04-09": {
        id: "gpt-4-turbo-2024-04-09"
      }
    }
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
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5
        },
        modelString: "gpt-4.1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1",
    variants: {
      "gpt-4.1-2025-04-14": {
        id: "gpt-4.1-2025-04-14"
      }
    }
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
          prompt_token: 0.4,
          completion_token: 1.6,
          prompt_cache_read_token: 0.1
        },
        modelString: "gpt-4.1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1-mini",
    variants: {
      "gpt-4.1-mini-2025-04-14": {
        id: "gpt-4.1-mini-2025-04-14"
      }
    }
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
          prompt_token: 0.1,
          completion_token: 0.4,
          prompt_cache_read_token: 0.025
        },
        modelString: "gpt-4.1-nano",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4.1-nano",
    variants: {
      "gpt-4.1-nano-2025-04-14": {
        id: "gpt-4.1-nano-2025-04-14"
      }
    }
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
          prompt_token: 75,
          completion_token: 150,
          prompt_cache_read_token: 37.5
        },
        modelString: "gpt-4.5-preview",
        rateLimit: {
          tpm: 250000,
          rpm: 3000
        }
      }
    },
    slug: "gpt-4.5-preview",
    variants: {
      "gpt-4.5-preview-2025-02-27": {
        id: "gpt-4.5-preview-2025-02-27"
      }
    }
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
          prompt_token: 2.5,
          completion_token: 10,
          prompt_cache_read_token: 1.25
        },
        modelString: "gpt-4o",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4o",
    variants: {
      "gpt-4o-2024-08-06": {
        id: "gpt-4o-2024-08-06"
      },
      "gpt-4o-2024-11-20": {
        id: "gpt-4o-2024-11-20"
      },
      "gpt-4o-2024-05-13": {
        id: "gpt-4o-2024-05-13",
        providers: {
          openai: {
            provider: "openai",
            available: true,
            cost: {
              prompt_token: 5,
              completion_token: 15
            },
            modelString: "gpt-4o-2024-05-13"
          }
        }
      }
    }
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
          prompt_token: 0.15,
          completion_token: 0.6,
          prompt_cache_read_token: 0.075
        },
        modelString: "gpt-4o-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "gpt-4o-mini",
    variants: {
      "gpt-4o-mini-2024-07-18": {
        id: "gpt-4o-mini-2024-07-18"
      }
    }
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
          prompt_token: 0.15,
          completion_token: 0.6
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
          prompt_token: 2.5,
          completion_token: 10
        },
        modelString: "gpt-4o-search-preview",
        rateLimit: {
          tpm: 3000000,
          rpm: 1000
        }
      }
    },
    slug: "gpt-4o-search-preview",
    variants: {
      "gpt-4o-search-preview-2025-03-11": {
        id: "gpt-4o-search-preview-2025-03-11"
      }
    }
  },
  o1: {
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
          prompt_token: 15,
          completion_token: 60,
          prompt_cache_read_token: 7.5
        },
        modelString: "o1",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000000
        }
      }
    },
    slug: "o1",
    variants: {
      "o1-2024-12-17": {
        id: "o1-2024-12-17"
      },
      "o1-preview-2024-09-12": {
        id: "o1-preview-2024-09-12"
      }
    }
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
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.55
        },
        modelString: "o1-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o1-mini",
    variants: {
      "o1-mini-2024-09-12": {
        id: "o1-mini-2024-09-12"
      }
    }
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
          prompt_token: 150,
          completion_token: 600
        },
        modelString: "o1-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "o1-pro",
    variants: {
      "o1-pro-2025-03-19": {
        id: "o1-pro-2025-03-19"
      }
    }
  },
  o3: {
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
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5
        },
        modelString: "o3",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o3",
    variants: {
      "o3-2025-04-16": {
        id: "o3-2025-04-16"
      }
    }
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
          prompt_token: 10,
          completion_token: 40,
          prompt_cache_read_token: 2.5
        },
        modelString: "o3-deep-research",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o3-deep-research",
    variants: {
      "o3-deep-research-2025-06-26": {
        id: "o3-deep-research-2025-06-26"
      }
    }
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
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.55
        },
        modelString: "o3-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o3-mini",
    variants: {
      "o3-mini-2025-01-31": {
        id: "o3-mini-2025-01-31"
      }
    }
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
          prompt_token: 20,
          completion_token: 80
        },
        modelString: "o3-pro",
        rateLimit: {
          tpm: 30000000,
          rpm: 10000,
          tpd: 5000000000
        }
      }
    },
    slug: "o3-pro",
    variants: {
      "o3-pro-2025-06-10": {
        id: "o3-pro-2025-06-10"
      }
    }
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
          prompt_token: 1.1,
          completion_token: 4.4,
          prompt_cache_read_token: 0.275
        },
        modelString: "o4-mini",
        rateLimit: {
          tpm: 150000000,
          rpm: 30000,
          tpd: 15000000000
        }
      }
    },
    slug: "o4-mini",
    variants: {
      "o4-mini-2025-04-16": {
        id: "o4-mini-2025-04-16"
      }
    }
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
          prompt_token: 2,
          completion_token: 8,
          prompt_cache_read_token: 0.5
        },
        modelString: "o4-mini-deep-research",
        rateLimit: {
          tpm: 150000000,
          rpm: 10000,
          tpd: 10000000
        }
      }
    },
    slug: "o4-mini-deep-research",
    variants: {
      "o4-mini-deep-research-2025-06-26": {
        id: "o4-mini-deep-research-2025-06-26"
      }
    }
  }
} satisfies Record<string, BaseModel>;
