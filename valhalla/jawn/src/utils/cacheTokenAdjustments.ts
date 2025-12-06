/**
 * Hardcoded cache write token adjustments for orgs with missing data.
 *
 * Background: Anthropic cache_creation_input_tokens weren't being stored in
 * prompt_cache_write_tokens column, causing undercharging. This config adds
 * the missing cost at invoice time.
 *
 * Values calculated from S3 sampling (median tokens × request count × price).
 * See: /valhalla/jawn/src/managers/admin/CACHE_TOKEN_ADJUSTMENT_README.md
 */

import { registry } from "@helicone-package/cost/models/registry";

export interface CacheTokenAdjustment {
  orgId: string;
  model: string;
  provider: string;
  /** Only apply adjustment for requests before this date (when fix was deployed) */
  beforeDate: Date;
  /** Total missing cache write tokens (count × median tokens per request) */
  totalMissingTokens: number;
}

/**
 * Get cache write price per token from the cost registry.
 * Uses the write5m or write1h multiplier from cacheMultipliers, or falls back to 1.25× input.
 */
function getCacheWritePricePerToken(model: string, provider: string): number {
  const configResult = registry.getModelProviderConfig(model, provider);
  if (configResult.error || !configResult.data?.pricing?.[0]) {
    console.warn(`No pricing found for ${model}:${provider}, using 0`);
    return 0;
  }
  const p = configResult.data.pricing[0];
  const cacheMultipliers = p.cacheMultipliers;
  // Use the 5m or 1h write multiplier if available, otherwise fall back to 1.25×
  const writeMultiplier = cacheMultipliers?.write5m ?? cacheMultipliers?.write1h ?? 1.25;
  return p.input * writeMultiplier;
}

export const CACHE_TOKEN_ADJUSTMENTS: CacheTokenAdjustment[] = [
  // TEST: Local dev org for testing adjustments
  // Remove before deploying to production!
  {
    orgId: "83635a30-5ba6-41a8-8cc6-fb7df941b24a",
    model: "gpt-4o",
    provider: "OPENAI",
    beforeDate: new Date("2099-12-31T00:00:00Z"), // Far future for testing
    totalMissingTokens: 100 * 5000, // Test adjustment
  },
  {
    orgId: "83635a30-5ba6-41a8-8cc6-fb7df941b24a",
    model: "gpt-4o-mini",
    provider: "OPENAI",
    beforeDate: new Date("2099-12-31T00:00:00Z"),
    totalMissingTokens: 100 * 5000, // Test adjustment
  },

  // Org: 63452b7b-54e6-470c-a9e7-a69b2e17a4cf
  // Data from 30-day sample ending 2025-12-05
  // Methodology: Sampled 5,250 requests from S3, calculated median cache_creation_input_tokens per model
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-sonnet-4",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 21436 * 16492, // 21,436 requests × 16,492 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-sonnet",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 18982 * 40496, // 18,982 requests × 40,496 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-opus-4",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3689 * 32235, // 3,689 requests × 32,235 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.5-haiku",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3100 * 44201, // 3,100 requests × 44,201 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.7-sonnet",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1519 * 18270, // 1,519 requests × 18,270 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-haiku",
    provider: "ANTHROPIC",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1492 * 14875, // 1,492 requests × 14,875 median tokens
  },
];

/**
 * Get cache token adjustment for a specific org/model/date range.
 * Returns the additional USD to add to the invoice line item.
 */
export function getCacheTokenAdjustment(
  orgId: string,
  model: string,
  startDate: Date,
  endDate: Date
): number {
  const adjustment = CACHE_TOKEN_ADJUSTMENTS.find(
    (a) =>
      a.orgId === orgId &&
      a.model === model &&
      startDate < a.beforeDate // Only apply if invoice period starts before fix date
  );

  if (!adjustment) return 0;

  // Get price from registry
  const pricePerToken = getCacheWritePricePerToken(adjustment.model, adjustment.provider);
  return adjustment.totalMissingTokens * pricePerToken;
}

/**
 * Get total cache token adjustment for an org (for summary).
 */
export function getTotalCacheTokenAdjustment(orgId: string): number {
  return CACHE_TOKEN_ADJUSTMENTS.filter((a) => a.orgId === orgId).reduce(
    (sum, a) => {
      const pricePerToken = getCacheWritePricePerToken(a.model, a.provider);
      return sum + a.totalMissingTokens * pricePerToken;
    },
    0
  );
}

/**
 * Get all cache token adjustments for an org, grouped by model.
 * Used for spend breakdown display.
 * Returns both the USD adjustment and the missing token count.
 */
export function getCacheTokenAdjustmentsByModel(
  orgId: string,
  startDate: Date,
  endDate: Date
): Map<string, { amountUsd: number; missingTokens: number }> {
  const adjustments = new Map<string, { amountUsd: number; missingTokens: number }>();

  for (const a of CACHE_TOKEN_ADJUSTMENTS) {
    if (a.orgId === orgId && startDate < a.beforeDate) {
      const pricePerToken = getCacheWritePricePerToken(a.model, a.provider);
      const amount = a.totalMissingTokens * pricePerToken;
      const existing = adjustments.get(a.model) || { amountUsd: 0, missingTokens: 0 };
      adjustments.set(a.model, {
        amountUsd: existing.amountUsd + amount,
        missingTokens: existing.missingTokens + a.totalMissingTokens,
      });
    }
  }

  return adjustments;
}
