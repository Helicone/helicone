/**
 * Pure rate limiting logic - no storage dependencies.
 *
 * This module contains the core rate limiting decision logic used by:
 * - RateLimiterDO.ts (the actual Durable Object)
 * - RateLimiterDO.test.ts (tests)
 *
 * By centralizing this logic, we ensure tests always verify the real behavior.
 */

export interface RateLimitInput {
  currentUsage: number;
  unitCount: number;
  quota: number;
  oldestTimestamp?: number;
  timeWindowMs: number;
  now: number;
  checkOnly: boolean;
}

export interface RateLimitResult {
  wouldExceed: boolean;
  remaining: number;
  finalRemaining: number;
  finalCurrentUsage: number;
  reset?: number;
}

/**
 * Core rate limiting logic.
 *
 * @param input - The rate limit calculation inputs
 * @returns The rate limit decision and computed values
 */
export function calculateRateLimit(input: RateLimitInput): RateLimitResult {
  const {
    currentUsage,
    unitCount,
    quota,
    oldestTimestamp,
    timeWindowMs,
    now,
    checkOnly,
  } = input;

  // Check if adding this request would meet or exceed the quota
  // Using >= because at exactly the quota, the user should be rate limited
  const wouldExceed = currentUsage + unitCount >= quota;

  const remaining = Math.max(0, quota - currentUsage);

  // Calculate reset time (when the oldest entry will fall out of the window)
  let reset: number | undefined;
  if (oldestTimestamp !== undefined) {
    reset = Math.ceil((oldestTimestamp + timeWindowMs - now) / 1000);
    reset = Math.max(0, reset);
  }

  // If rate limited or check-only, usage doesn't change
  const usageIncreases = !checkOnly && !wouldExceed;

  const finalRemaining = usageIncreases
    ? Math.max(0, remaining - unitCount)
    : remaining;

  const finalCurrentUsage = usageIncreases
    ? currentUsage + unitCount
    : currentUsage;

  return {
    wouldExceed,
    remaining,
    finalRemaining,
    finalCurrentUsage,
    reset,
  };
}
