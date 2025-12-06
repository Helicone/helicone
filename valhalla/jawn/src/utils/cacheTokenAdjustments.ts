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

export interface CacheTokenAdjustment {
  orgId: string;
  model: string;
  /** Only apply adjustment for requests before this date (when fix was deployed) */
  beforeDate: Date;
  /** Total missing cache write tokens (count × median tokens per request) */
  totalMissingTokens: number;
  /** Cache write price per token */
  pricePerToken: number;
}

export const CACHE_TOKEN_ADJUSTMENTS: CacheTokenAdjustment[] = [
  // TEST: Local dev org for testing adjustments
  // Remove before deploying to production!
  {
    orgId: "83635a30-5ba6-41a8-8cc6-fb7df941b24a",
    model: "gpt-4o",
    beforeDate: new Date("2099-12-31T00:00:00Z"), // Far future for testing
    totalMissingTokens: 100 * 5000, // Test: adds ~$1.25 adjustment
    pricePerToken: 0.0000025, // $2.50/MTok
  },
  {
    orgId: "83635a30-5ba6-41a8-8cc6-fb7df941b24a",
    model: "gpt-4o-mini",
    beforeDate: new Date("2099-12-31T00:00:00Z"),
    totalMissingTokens: 100 * 5000, // Test: adds ~$0.075 adjustment
    pricePerToken: 0.00000015, // $0.15/MTok
  },

  // Org: 63452b7b-54e6-470c-a9e7-a69b2e17a4cf
  // Data from 30-day sample ending 2025-12-05
  // Methodology: Sampled 5,250 requests from S3, calculated median cache_creation_input_tokens per model
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-sonnet-4",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 21436 * 16492, // 21,436 requests × 16,492 median tokens
    pricePerToken: 0.00000375, // $3.75/MTok (sonnet cache write = input × 1.25)
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-sonnet",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 18982 * 40496, // 18,982 requests × 40,496 median tokens
    pricePerToken: 0.00000375,
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-opus-4",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3689 * 32235, // 3,689 requests × 32,235 median tokens
    pricePerToken: 0.00001875, // $18.75/MTok (opus cache write = input × 1.25)
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.5-haiku",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3100 * 44201, // 3,100 requests × 44,201 median tokens
    pricePerToken: 0.000001, // $1/MTok (haiku cache write = input × 1.25)
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.7-sonnet",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1519 * 18270, // 1,519 requests × 18,270 median tokens
    pricePerToken: 0.00000375,
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-haiku",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1492 * 14875, // 1,492 requests × 14,875 median tokens
    pricePerToken: 0.000001,
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

  // Calculate the USD adjustment
  return adjustment.totalMissingTokens * adjustment.pricePerToken;
}

/**
 * Get total cache token adjustment for an org (for summary).
 */
export function getTotalCacheTokenAdjustment(orgId: string): number {
  return CACHE_TOKEN_ADJUSTMENTS.filter((a) => a.orgId === orgId).reduce(
    (sum, a) => sum + a.totalMissingTokens * a.pricePerToken,
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
      const amount = a.totalMissingTokens * a.pricePerToken;
      const existing = adjustments.get(a.model) || { amountUsd: 0, missingTokens: 0 };
      adjustments.set(a.model, {
        amountUsd: existing.amountUsd + amount,
        missingTokens: existing.missingTokens + a.totalMissingTokens,
      });
    }
  }

  return adjustments;
}
