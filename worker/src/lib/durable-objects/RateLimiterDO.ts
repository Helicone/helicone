import { DurableObject } from "cloudflare:workers";

export interface RateLimitRequest {
  segmentKey: string;
  timeWindow: number; // seconds
  quota: number;
  unit: "request" | "cents";
  cost?: number; // for cents-based limiting
  checkOnly?: boolean; // if true, only check without updating
}

export interface RateLimitResponse {
  status: "ok" | "rate_limited";
  limit: number;
  remaining: number;
  reset?: number; // seconds until reset
  currentUsage: number;
}

/**
 * Optimized Rate Limiter using time-bucketed aggregation
 *
 * Instead of storing one row per request (which fails at scale),
 * we bucket requests into time intervals (e.g., 1 second buckets).
 *
 * For a 60-second window with 1-second buckets:
 * - Maximum 60 rows instead of potentially millions
 * - Much faster queries (SUM over 60 rows vs 1M rows)
 * - Automatic cleanup as buckets expire
 *
 * Trade-off: Slightly less precise (bucketed to nearest second)
 * but this is acceptable for rate limiting use cases.
 */
export class RateLimiterDO extends DurableObject {
  private sql: SqlStorage;
  private state: DurableObjectState;

  // Bucket size in milliseconds - smaller = more precise but more rows
  // 1000ms (1 second) is a good balance for most use cases
  private readonly BUCKET_SIZE_MS = 1000;

  // Precision multiplier to avoid floating point errors
  // Store costs in units of 0.0001 cents (10,000 = 1 cent)
  // This allows us to handle very small costs like $0.0001 (= 0.01 cents)
  private readonly PRECISION_MULTIPLIER = 10000;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    this.state = state;
    this.sql = state.storage.sql;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        segment_key TEXT NOT NULL,
        bucket_timestamp INTEGER NOT NULL,
        unit_count REAL NOT NULL DEFAULT 0,
        PRIMARY KEY (segment_key, bucket_timestamp)
      );

      CREATE INDEX IF NOT EXISTS idx_bucket_timestamp
      ON rate_limit_buckets(bucket_timestamp);
    `);

    // Migration: Copy data from old table to new bucketed table if it exists
    try {
      const oldTableExists = this.sql.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='rate_limit_entries'"
      ).toArray();

      if (oldTableExists.length > 0) {
        // Migrate existing data by bucketing it
        this.sql.exec(`
          INSERT INTO rate_limit_buckets (segment_key, bucket_timestamp, unit_count)
          SELECT
            segment_key,
            (timestamp / ${this.BUCKET_SIZE_MS}) * ${this.BUCKET_SIZE_MS} as bucket_timestamp,
            SUM(unit_count) * ${this.PRECISION_MULTIPLIER} as unit_count
          FROM rate_limit_entries
          GROUP BY segment_key, bucket_timestamp
          ON CONFLICT(segment_key, bucket_timestamp)
          DO UPDATE SET unit_count = unit_count + excluded.unit_count
        `);

        // Drop the old table
        this.sql.exec("DROP TABLE rate_limit_entries");
        this.sql.exec("DROP INDEX IF EXISTS idx_segment_timestamp");
        this.sql.exec("DROP INDEX IF EXISTS idx_cleanup");
      }
    } catch (error) {
      // If migration fails, log but don't crash
      console.error("Rate limiter migration error (non-fatal):", error);
    }

    // Migration: Convert existing floating-point values to integer precision
    // This ensures backward compatibility with existing rate limit buckets
    try {
      // Check if we need to migrate by looking for a sentinel value
      // We'll add a metadata table to track migrations
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS rate_limit_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      const migrationCheck = this.sql
        .exec(
          "SELECT value FROM rate_limit_metadata WHERE key = 'precision_migration_v1'"
        )
        .one();

      if (!migrationCheck) {
        // Migration hasn't run yet
        // Update all existing buckets to use integer precision
        // Only update buckets that are recent (within last hour) to avoid updating stale data
        const oneHourAgo = Date.now() - 3600000;
        const migrationBucket = this.getBucketTimestamp(oneHourAgo);

        console.log(
          `[RateLimiterDO] Running precision migration for recent buckets (since ${new Date(oneHourAgo).toISOString()})`
        );

        // Note: This migration multiplies existing values by PRECISION_MULTIPLIER
        // Older buckets (>1 hour) will naturally expire and not need migration
        this.sql.exec(
          `UPDATE rate_limit_buckets
           SET unit_count = unit_count * ${this.PRECISION_MULTIPLIER}
           WHERE bucket_timestamp >= ?
           AND unit_count < 1000`,
          migrationBucket
        );

        // Mark migration as complete
        this.sql.exec(
          "INSERT INTO rate_limit_metadata (key, value) VALUES ('precision_migration_v1', ?)",
          new Date().toISOString()
        );

        console.log("[RateLimiterDO] Precision migration completed");
      }
    } catch (error) {
      // If migration fails, log but don't crash
      // The system will work with mixed precision (less accurate but won't break)
      console.error(
        "Rate limiter precision migration error (non-fatal):",
        error
      );
    }
  }

  /**
   * Get the bucket timestamp for a given time
   */
  private getBucketTimestamp(timestampMs: number): number {
    return Math.floor(timestampMs / this.BUCKET_SIZE_MS) * this.BUCKET_SIZE_MS;
  }

  public async processRateLimit(
    req: RateLimitRequest
  ): Promise<RateLimitResponse> {
    const now = Date.now();
    const currentBucket = this.getBucketTimestamp(now);
    const windowStartMs = now - req.timeWindow * 1000;
    const windowStartBucket = this.getBucketTimestamp(windowStartMs);

    // Convert to integer units to avoid floating point errors
    // For cents-based limiting, multiply by PRECISION_MULTIPLIER
    const requestUnitCount =
      req.unit === "cents"
        ? Math.round((req.cost || 0) * this.PRECISION_MULTIPLIER)
        : this.PRECISION_MULTIPLIER; // For request-based, use the multiplier as the unit

    const quotaInUnits = Math.round(req.quota * this.PRECISION_MULTIPLIER);

    // Use the storage transaction API for atomic operations
    // Wrap in try-catch to handle potential transaction conflicts
    try {
      return this.state.storage.transactionSync(() => {
        // Clean up old buckets outside the window
        // This is much faster than deleting individual entries
        this.sql.exec(
          "DELETE FROM rate_limit_buckets WHERE segment_key = ? AND bucket_timestamp < ?",
          req.segmentKey,
          windowStartBucket
        );

        // Get current usage within the window (in integer units)
        const currentUsageResult = this.sql
          .exec(
            `SELECT COALESCE(SUM(unit_count), 0) as total
           FROM rate_limit_buckets
           WHERE segment_key = ? AND bucket_timestamp >= ?`,
            req.segmentKey,
            windowStartBucket
          )
          .one();

        const currentUsageInUnits = Number(currentUsageResult?.total || 0);

        // Check if adding this request would exceed the quota
        // Use > instead of >= so that hitting exactly the quota is allowed
        const wouldExceed =
          currentUsageInUnits + requestUnitCount > quotaInUnits;

        // If not check-only and not rate limited, record the usage
        if (!req.checkOnly && !wouldExceed) {
          // Insert or update the bucket for the current time
          // This aggregates multiple requests in the same second
          this.sql.exec(
            `INSERT INTO rate_limit_buckets (segment_key, bucket_timestamp, unit_count)
             VALUES (?, ?, ?)
             ON CONFLICT(segment_key, bucket_timestamp)
             DO UPDATE SET unit_count = unit_count + ?`,
            req.segmentKey,
            currentBucket,
            requestUnitCount,
            requestUnitCount
          );
        }

        // Get the oldest bucket timestamp for reset calculation
        const oldestBucket = this.sql
          .exec(
            `SELECT MIN(bucket_timestamp) as oldest
           FROM rate_limit_buckets
           WHERE segment_key = ? AND bucket_timestamp >= ?`,
            req.segmentKey,
            windowStartBucket
          )
          .one();

        // Calculate reset time (when the oldest bucket will fall out of the window)
        let reset: number | undefined;
        if (oldestBucket?.oldest) {
          reset = Math.ceil(
            (Number(oldestBucket.oldest) + req.timeWindow * 1000 - now) / 1000
          );
          reset = Math.max(0, reset);
        }

        // Convert back to original units for the response
        const currentUsage =
          currentUsageInUnits / this.PRECISION_MULTIPLIER;
        const remaining = Math.max(
          0,
          (quotaInUnits - currentUsageInUnits) / this.PRECISION_MULTIPLIER
        );
        const finalRemaining = wouldExceed
          ? remaining
          : Math.max(
              0,
              (quotaInUnits -
                currentUsageInUnits -
                requestUnitCount) /
                this.PRECISION_MULTIPLIER
            );
        const finalCurrentUsage = wouldExceed
          ? currentUsage
          : (currentUsageInUnits + requestUnitCount) /
            this.PRECISION_MULTIPLIER;

        return {
          status: wouldExceed ? "rate_limited" : "ok",
          limit: req.quota,
          remaining: finalRemaining,
          reset,
          currentUsage: finalCurrentUsage,
        };
      });
    } catch (error) {
      // If transaction fails (e.g., due to contention), log and return a safe response
      console.error(
        `[RateLimiterDO] Transaction failed for ${req.segmentKey}:`,
        error
      );
      // Return "ok" to avoid blocking requests when the rate limiter has issues
      // This is better than crashing and prevents cascading failures
      return {
        status: "ok",
        limit: req.quota,
        remaining: req.quota,
        reset: undefined,
        currentUsage: 0,
      };
    }
  }

  async cleanup(olderThanMs: number): Promise<number> {
    const threshold = this.getBucketTimestamp(Date.now() - olderThanMs);

    const countBefore = this.sql
      .exec(
        "SELECT COUNT(*) as count FROM rate_limit_buckets WHERE bucket_timestamp < ?",
        threshold
      )
      .one();

    this.sql.exec(
      "DELETE FROM rate_limit_buckets WHERE bucket_timestamp < ?",
      threshold
    );

    return Number(countBefore?.count || 0);
  }

  async getState(segmentKey: string, timeWindow: number): Promise<any> {
    const windowStartMs = Date.now() - timeWindow * 1000;
    const windowStartBucket = this.getBucketTimestamp(windowStartMs);

    const buckets = this.sql
      .exec(
        `SELECT * FROM rate_limit_buckets
       WHERE segment_key = ? AND bucket_timestamp >= ?
       ORDER BY bucket_timestamp DESC`,
        segmentKey,
        windowStartBucket
      )
      .toArray();

    const total = this.sql
      .exec(
        `SELECT COALESCE(SUM(unit_count), 0) as total
       FROM rate_limit_buckets
       WHERE segment_key = ? AND bucket_timestamp >= ?`,
        segmentKey,
        windowStartBucket
      )
      .one();

    const totalInUnits = Number(total?.total || 0);

    return {
      segmentKey,
      buckets: buckets.length,
      totalUsage: totalInUnits / this.PRECISION_MULTIPLIER, // Convert back to original units
      totalUsageInUnits: totalInUnits, // Also include raw value for debugging
      oldestBucket: buckets[buckets.length - 1]?.bucket_timestamp,
      newestBucket: buckets[0]?.bucket_timestamp,
      bucketSizeMs: this.BUCKET_SIZE_MS,
      precisionMultiplier: this.PRECISION_MULTIPLIER,
    };
  }
}
