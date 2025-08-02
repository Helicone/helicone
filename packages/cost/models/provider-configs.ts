/**
 * Provider configurations with organization-specific rate limits
 * This file stores your organization's rate limits for each provider
 */

import type { ProviderConfig } from "./types";

export const providerConfigs: Record<string, ProviderConfig> = {
  openai: {
    provider: "openai",
    monthlyUsageLimit: 200000, // $200,000.00 monthly limit
    globalRateLimits: {
      defaultModels: {
        tpm: 250000,
        rpm: 3000
      }
    }
  },
  anthropic: {
    provider: "anthropic",
    monthlyUsageLimit: null, // No limit specified yet
    globalRateLimits: {
      defaultModels: {
        tpm: 100000,
        rpm: 1000
      }
    }
  },
  azure: {
    provider: "azure",
    monthlyUsageLimit: null, // No limit specified yet
    globalRateLimits: {
      defaultModels: {
        tpm: 100000,
        rpm: 1000
      }
    }
  }
};