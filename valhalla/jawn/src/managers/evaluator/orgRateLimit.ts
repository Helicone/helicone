import { redisClient } from "../../lib/clients/redisClient";
import { dbExecute } from "../../lib/shared/db/dbExecute";

/**
 * Tiers allowed to run evaluators that spend Helicone-paid compute or LLM
 * credits (LLM-as-a-judge, lastmile). `free` is deliberately
 * not included.
 */
export const PAID_EVALUATOR_TIERS = [
  "pro-20240913",
  "pro-20250202",
  "enterprise",
  "demo",
  "team-20250130",
] as const;

export function isPaidEvaluatorTier(tier: string | null | undefined): boolean {
  return (PAID_EVALUATOR_TIERS as readonly string[]).includes(tier ?? "");
}

/** Looks up the org's tier and checks it against PAID_EVALUATOR_TIERS. */
export async function orgHasPaidEvaluatorTier(orgId: string): Promise<boolean> {
  const result = await dbExecute<{ tier: string | null }>(
    `SELECT tier FROM organization WHERE id = $1 LIMIT 1`,
    [orgId]
  );
  if (result.error || !result.data?.[0]) {
    return false;
  }
  return isPaidEvaluatorTier(result.data[0].tier);
}

export interface OrgRateLimitParams {
  /** Logical bucket, e.g. "evaluator-llm-test". */
  bucket: string;
  orgId: string;
  /** Max requests allowed per window. */
  limit: number;
  windowSeconds: number;
}

export interface OrgRateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

// Fallback store when Redis isn't configured (local dev, tests) or errors.
const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

function memoryIncrement(key: string, windowSeconds: number): number {
  const now = Date.now();
  if (memoryCounters.size > 10_000) {
    for (const [k, v] of memoryCounters) {
      if (v.expiresAt <= now) {
        memoryCounters.delete(k);
      }
    }
  }
  const existing = memoryCounters.get(key);
  if (!existing || existing.expiresAt <= now) {
    memoryCounters.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return 1;
  }
  existing.count++;
  return existing.count;
}

/** Test helper. */
export function resetOrgRateLimitMemory() {
  memoryCounters.clear();
}

/**
 * Fixed-window per-org rate limit. Uses Redis when available so the limit is
 * shared across Jawn instances, otherwise falls back to process memory.
 */
export async function checkOrgRateLimit({
  bucket,
  orgId,
  limit,
  windowSeconds,
}: OrgRateLimitParams): Promise<OrgRateLimitResult> {
  const windowIndex = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `jawn:org-rl:${bucket}:${orgId}:${windowIndex}`;

  let count: number | null = null;
  if (redisClient) {
    try {
      const res = await redisClient
        .multi()
        .incr(key)
        .expire(key, windowSeconds + 1)
        .exec();
      const incr = res?.[0];
      if (incr && !incr[0] && typeof incr[1] === "number") {
        count = incr[1];
      }
    } catch (e) {
      console.error("org rate limit redis error", e);
    }
  }

  if (count === null) {
    count = memoryIncrement(key, windowSeconds);
  }

  return { allowed: count <= limit, count, limit };
}

export const EVALUATOR_RATE_LIMITS = {
  llmTest: { bucket: "evaluator-llm-test", limit: 30, windowSeconds: 60 },
  lastMileTest: {
    bucket: "evaluator-lastmile-test",
    limit: 20,
    windowSeconds: 60,
  },
  playgroundGenerate: {
    bucket: "playground-generate",
    limit: 60,
    windowSeconds: 60,
  },
} as const;
