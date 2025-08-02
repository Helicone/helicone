/**
 * Model variant definitions
 * Auto-generated on: ${new Date().toISOString()}
 * Total variants: 30
 * Variants with overrides: 0
 * Pure inheritance: 30
 */

import type { ModelVariant } from "../types";
import type { BaseModelId } from "./base-models";

// This ensures baseModelId references are valid and enables IDE navigation
export const modelVariants: Record<string, ModelVariant & { baseModelId: BaseModelId }> = {
  // GPT-4.1 variants
  "gpt-4.1-2025-04-14": {
    id: "gpt-4.1-2025-04-14",
    baseModelId: "gpt-4.1"
  },
  "gpt-4.1-mini-2025-04-14": {
    id: "gpt-4.1-mini-2025-04-14",
    baseModelId: "gpt-4.1-mini"
  },
  "gpt-4.1-nano-2025-04-14": {
    id: "gpt-4.1-nano-2025-04-14",
    baseModelId: "gpt-4.1-nano"
  },
  
  // GPT-4.5 variant
  "gpt-4.5-preview-2025-02-27": {
    id: "gpt-4.5-preview-2025-02-27",
    baseModelId: "gpt-4.5-preview"
  },
  
  // GPT-4o variants
  "gpt-4o-2024-08-06": {
    id: "gpt-4o-2024-08-06",
    baseModelId: "gpt-4o"
  },
  "gpt-4o-2024-11-20": {
    id: "gpt-4o-2024-11-20",
    baseModelId: "gpt-4o"
  },
  "gpt-4o-2024-05-13": {
    id: "gpt-4o-2024-05-13",
    baseModelId: "gpt-4o",
    // Override for older variant with different pricing
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0.000015
        },
        modelString: "gpt-4o-2024-05-13"
      }
    }
  },
  "gpt-4o-mini-2024-07-18": {
    id: "gpt-4o-mini-2024-07-18",
    baseModelId: "gpt-4o-mini"
  },
  
  // O1 variants
  "o1-2024-12-17": {
    id: "o1-2024-12-17",
    baseModelId: "o1"
  },
  "o1-preview-2024-09-12": {
    id: "o1-preview-2024-09-12",
    baseModelId: "o1"
  },
  "o1-pro-2025-03-19": {
    id: "o1-pro-2025-03-19",
    baseModelId: "o1-pro"
  },
  "o1-mini-2024-09-12": {
    id: "o1-mini-2024-09-12",
    baseModelId: "o1-mini"
  },
  
  // O3 variants
  "o3-2025-04-16": {
    id: "o3-2025-04-16",
    baseModelId: "o3"
  },
  "o3-pro-2025-06-10": {
    id: "o3-pro-2025-06-10",
    baseModelId: "o3-pro"
  },
  "o3-deep-research-2025-06-26": {
    id: "o3-deep-research-2025-06-26",
    baseModelId: "o3-deep-research"
  },
  "o3-mini-2025-01-31": {
    id: "o3-mini-2025-01-31",
    baseModelId: "o3-mini"
  },
  
  // O4 variants
  "o4-mini-2025-04-16": {
    id: "o4-mini-2025-04-16",
    baseModelId: "o4-mini"
  },
  "o4-mini-deep-research-2025-06-26": {
    id: "o4-mini-deep-research-2025-06-26",
    baseModelId: "o4-mini-deep-research"
  },
  
  // Specialized model variants
  "gpt-4o-mini-search-preview-2025-03-11": {
    id: "gpt-4o-mini-search-preview-2025-03-11",
    baseModelId: "gpt-4o-mini-search-preview"
  },
  "gpt-4o-search-preview-2025-03-11": {
    id: "gpt-4o-search-preview-2025-03-11",
    baseModelId: "gpt-4o-search-preview"
  },
  "computer-use-preview-2025-03-11": {
    id: "computer-use-preview-2025-03-11",
    baseModelId: "computer-use-preview"
  },
  
  // GPT-3.5 variants
  "gpt-3.5-turbo-0125": {
    id: "gpt-3.5-turbo-0125",
    baseModelId: "gpt-3.5-turbo"
  },
  "gpt-3.5-turbo-16k-0613": {
    id: "gpt-3.5-turbo-16k-0613",
    baseModelId: "gpt-3.5-turbo-16k"
  },
  
  // GPT-4 variants
  "gpt-4-turbo-2024-04-09": {
    id: "gpt-4-turbo-2024-04-09",
    baseModelId: "gpt-4-turbo"
  },
  "gpt-4-0613": {
    id: "gpt-4-0613",
    baseModelId: "gpt-4"
  },
  
  // Audio variants
  "gpt-4o-audio-preview-2025-06-03": {
    id: "gpt-4o-audio-preview-2025-06-03",
    baseModelId: "gpt-4o"
  },
  "gpt-4o-audio-preview-2024-12-17": {
    id: "gpt-4o-audio-preview-2024-12-17",
    baseModelId: "gpt-4o"
  },
  "gpt-4o-audio-preview-2024-10-01": {
    id: "gpt-4o-audio-preview-2024-10-01",
    baseModelId: "gpt-4o"
  },
  "gpt-4o-mini-audio-preview-2024-12-17": {
    id: "gpt-4o-mini-audio-preview-2024-12-17",
    baseModelId: "gpt-4o-mini"
  },
  
  // Realtime variants
  "gpt-4o-realtime-preview-2025-06-03": {
    id: "gpt-4o-realtime-preview-2025-06-03",
    baseModelId: "gpt-4o",
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0.00002,
          prompt_cache_read_token: 0.0000025
        },
        modelString: "gpt-4o-realtime-preview-2025-06-03"
      }
    }
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    id: "gpt-4o-realtime-preview-2024-12-17",
    baseModelId: "gpt-4o",
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0.00002,
          prompt_cache_read_token: 0.0000025
        },
        modelString: "gpt-4o-realtime-preview-2024-12-17"
      }
    }
  },
  "gpt-4o-realtime-preview-2024-10-01": {
    id: "gpt-4o-realtime-preview-2024-10-01",
    baseModelId: "gpt-4o",
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.000005,
          completion_token: 0.00002,
          prompt_cache_read_token: 0.0000025
        },
        modelString: "gpt-4o-realtime-preview-2024-10-01"
      }
    }
  },
  "gpt-4o-mini-realtime-preview-2024-12-17": {
    id: "gpt-4o-mini-realtime-preview-2024-12-17",
    baseModelId: "gpt-4o-mini",
    providers: {
      openai: {
        provider: "openai",
        available: true,
        cost: {
          prompt_token: 0.0000006,
          completion_token: 0.0000024,
          prompt_cache_read_token: 0.0000003
        },
        modelString: "gpt-4o-mini-realtime-preview-2024-12-17"
      }
    }
  }
};

export type ModelVariantId = keyof typeof modelVariants;