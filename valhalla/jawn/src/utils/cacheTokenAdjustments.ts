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
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

export const PTB_BILLING_FILTER = `is_passthrough_billing = true
          AND cache_reference_id = '${DEFAULT_UUID}'`;

export interface CacheTokenAdjustment {
  orgId: string;
  model: string;
  /** Provider for pricing lookup (e.g., "anthropic") */
  provider: string;
  /** Provider in ClickHouse to match against (e.g., "helicone" for AI Gateway requests) */
  clickhouseProvider: string;
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
  const writeMultiplier =
    cacheMultipliers?.write5m ?? cacheMultipliers?.write1h ?? 1.25;
  return p.input * writeMultiplier;
}

export const CACHE_TOKEN_ADJUSTMENTS: CacheTokenAdjustment[] = [
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-sonnet-4",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 21436 * 16492, // 21,436 requests × 16,492 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-sonnet",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 18982 * 40496, // 18,982 requests × 40,496 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-opus-4",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3689 * 32235, // 3,689 requests × 32,235 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.5-haiku",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 3100 * 44201, // 3,100 requests × 44,201 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-3.7-sonnet",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1519 * 18270, // 1,519 requests × 18,270 median tokens
  },
  {
    orgId: "63452b7b-54e6-470c-a9e7-a69b2e17a4cf",
    model: "claude-4.5-haiku",
    provider: "anthropic",
    clickhouseProvider: "helicone",
    beforeDate: new Date("2025-12-06T00:00:00Z"),
    totalMissingTokens: 1492 * 14875, // 1,492 requests × 14,875 median tokens
  },
];

/**
 * Find a matching adjustment for the given criteria.
 * Central matching logic used by all public functions.
 */
function findAdjustment(
  orgId: string,
  model: string,
  clickhouseProvider: string,
  startDate: Date
): CacheTokenAdjustment | undefined {
  return CACHE_TOKEN_ADJUSTMENTS.find(
    (a) =>
      a.orgId === orgId &&
      a.model === model &&
      a.clickhouseProvider === clickhouseProvider &&
      startDate < a.beforeDate
  );
}

/**
 * Calculate USD amount for an adjustment.
 */
function calculateAdjustmentUsd(adjustment: CacheTokenAdjustment): number {
  const pricePerToken = getCacheWritePricePerToken(
    adjustment.model,
    adjustment.provider
  );
  return adjustment.totalMissingTokens * pricePerToken;
}

/**
 * Get cache token adjustment for a specific org/model/provider/date range.
 * Returns the additional USD to add to the invoice line item.
 * @param clickhouseProvider - The provider as stored in ClickHouse (e.g., "helicone")
 */
export function getCacheTokenAdjustment(
  orgId: string,
  model: string,
  clickhouseProvider: string,
  startDate: Date,
  endDate: Date
): number {
  const adjustment = findAdjustment(
    orgId,
    model,
    clickhouseProvider,
    startDate
  );
  if (!adjustment) return 0;
  return calculateAdjustmentUsd(adjustment);
}

/**
 * Get total cache token adjustment for an org (for summary).
 */
export function getTotalCacheTokenAdjustment(orgId: string): number {
  return CACHE_TOKEN_ADJUSTMENTS.filter((a) => a.orgId === orgId).reduce(
    (sum, a) => sum + calculateAdjustmentUsd(a),
    0
  );
}

/**
 * Get all cache token adjustments for an org, grouped by model+clickhouseProvider.
 * Used for spend breakdown display.
 * Returns both the USD adjustment and the missing token count.
 * Key format: "model:clickhouseProvider" (e.g., "claude-sonnet-4:helicone")
 */
export function getCacheTokenAdjustmentsByModel(
  orgId: string,
  startDate: Date,
  endDate: Date
): Map<string, { amountUsd: number; missingTokens: number }> {
  const adjustments = new Map<
    string,
    { amountUsd: number; missingTokens: number }
  >();

  for (const a of CACHE_TOKEN_ADJUSTMENTS) {
    if (findAdjustment(a.orgId, a.model, a.clickhouseProvider, startDate)) {
      if (a.orgId !== orgId) continue; // Only include this org's adjustments
      const amount = calculateAdjustmentUsd(a);
      const key = `${a.model}:${a.clickhouseProvider}`;
      const existing = adjustments.get(key) || {
        amountUsd: 0,
        missingTokens: 0,
      };
      adjustments.set(key, {
        amountUsd: existing.amountUsd + amount,
        missingTokens: existing.missingTokens + a.totalMissingTokens,
      });
    }
  }

  return adjustments;
}
