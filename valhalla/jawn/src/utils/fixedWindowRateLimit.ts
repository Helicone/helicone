import { redisClient } from "../lib/clients/redisClient";

// Fallback for local development without Redis (per process only).
const memoryCounters = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window counter. Returns true when the call is within `limit` for the
 * current window, false when it should be rejected. Fails open only if Redis
 * errors, so an outage of the limiter does not take the route down.
 */
export async function consumeFixedWindow(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const fullKey = `rl:fixed:${key}`;
  if (redisClient) {
    try {
      const count = await redisClient.incr(fullKey);
      if (count === 1) {
        await redisClient.pexpire(fullKey, windowMs);
      }
      return count <= limit;
    } catch (error) {
      console.error("Rate limiter error:", error);
      return true;
    }
  }

  const now = Date.now();
  const entry = memoryCounters.get(fullKey);
  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(fullKey, { count: 1, resetAt: now + windowMs });
    return 1 <= limit;
  }
  entry.count += 1;
  return entry.count <= limit;
}
