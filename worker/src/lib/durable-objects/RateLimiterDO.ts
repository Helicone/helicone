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

export class RateLimiterDO extends DurableObject {
  private sql: SqlStorage;
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    this.state = state;
    this.sql = state.storage.sql;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limit_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        segment_key TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        unit_count REAL NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
      
      CREATE INDEX IF NOT EXISTS idx_segment_timestamp 
      ON rate_limit_entries(segment_key, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_cleanup 
      ON rate_limit_entries(timestamp);
    `);
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const body: RateLimitRequest = await request.json();
      const result = await this.processRateLimit(body);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: result.status === "rate_limited" ? 429 : 200,
      });
    } catch (error) {
      console.error("[RateLimiterDO] Error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  private async processRateLimit(
    req: RateLimitRequest
  ): Promise<RateLimitResponse> {
    const now = Date.now();
    const windowStartMs = now - req.timeWindow * 1000;

    // Use the storage transaction API for atomic operations
    return this.state.storage.transactionSync(() => {
      // Clean up old entries outside the window
      this.sql.exec(
        "DELETE FROM rate_limit_entries WHERE segment_key = ? AND timestamp < ?",
        req.segmentKey,
        windowStartMs
      );

      // Get current usage within the window
      const currentUsageResult = this.sql
        .exec(
          `SELECT COALESCE(SUM(unit_count), 0) as total 
         FROM rate_limit_entries 
         WHERE segment_key = ? AND timestamp >= ?`,
          req.segmentKey,
          windowStartMs
        )
        .one();

      const currentUsage = Number(currentUsageResult?.total || 0);

      // Calculate the unit count for this request
      const unitCount = req.unit === "cents" ? req.cost || 0 : 1;

      // Check if adding this request would exceed the quota
      const wouldExceed = currentUsage + unitCount >= req.quota;
      const remaining = Math.max(0, req.quota - currentUsage);

      // If not check-only and not rate limited, record the usage
      if (!req.checkOnly && !wouldExceed) {
        this.sql.exec(
          "INSERT INTO rate_limit_entries (segment_key, timestamp, unit_count) VALUES (?, ?, ?)",
          req.segmentKey,
          now,
          unitCount
        );
      }

      // Get the oldest entry timestamp for reset calculation
      const oldestEntry = this.sql
        .exec(
          `SELECT MIN(timestamp) as oldest 
         FROM rate_limit_entries 
         WHERE segment_key = ? AND timestamp >= ?`,
          req.segmentKey,
          windowStartMs
        )
        .one();

      // Calculate reset time (when the oldest entry will fall out of the window)
      let reset: number | undefined;
      if (oldestEntry?.oldest) {
        reset = Math.ceil(
          (Number(oldestEntry.oldest) + req.timeWindow * 1000 - now) / 1000
        );
        reset = Math.max(0, reset);
      }

      const finalRemaining = wouldExceed
        ? remaining
        : Math.max(0, remaining - unitCount);
      const finalCurrentUsage = wouldExceed
        ? currentUsage
        : currentUsage + unitCount;

      console.log(`[RateLimiterDO] Rate limit check for ${req.segmentKey}:`, {
        unit: req.unit,
        quota: req.quota,
        currentUsage: finalCurrentUsage,
        remaining: finalRemaining,
        unitCount,
        wouldExceed,
        checkOnly: req.checkOnly,
        timeWindow: req.timeWindow,
      });

      return {
        status: wouldExceed ? "rate_limited" : "ok",
        limit: req.quota,
        remaining: finalRemaining,
        reset,
        currentUsage: finalCurrentUsage,
      };
    });
  }

  // Optional: Add a cleanup method that can be called periodically
  async cleanup(olderThanMs: number): Promise<number> {
    // Get count before deletion
    const countBefore = this.sql
      .exec(
        "SELECT COUNT(*) as count FROM rate_limit_entries WHERE timestamp < ?",
        Date.now() - olderThanMs
      )
      .one();

    // Perform deletion
    this.sql.exec(
      "DELETE FROM rate_limit_entries WHERE timestamp < ?",
      Date.now() - olderThanMs
    );

    // Return number of deleted rows
    return Number(countBefore?.count || 0);
  }

  // Optional: Get current state for debugging
  async getState(segmentKey: string, timeWindow: number): Promise<any> {
    const windowStartMs = Date.now() - timeWindow * 1000;

    const entries = this.sql
      .exec(
        `SELECT * FROM rate_limit_entries 
       WHERE segment_key = ? AND timestamp >= ?
       ORDER BY timestamp DESC`,
        segmentKey,
        windowStartMs
      )
      .toArray();

    const total = this.sql
      .exec(
        `SELECT COALESCE(SUM(unit_count), 0) as total 
       FROM rate_limit_entries 
       WHERE segment_key = ? AND timestamp >= ?`,
        segmentKey,
        windowStartMs
      )
      .one();

    return {
      segmentKey,
      entries: entries.length,
      totalUsage: total?.total || 0,
      oldestEntry: entries[entries.length - 1]?.timestamp,
      newestEntry: entries[0]?.timestamp,
    };
  }
}
