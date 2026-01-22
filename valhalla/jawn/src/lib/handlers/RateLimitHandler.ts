import { ClickhouseDB } from "../db/ClickhouseWrapper";
import {
  ok,
  PromiseGenericResult,
  err,
  GenericResult,
} from "../../packages/common/result";
import { RateLimitStore } from "../stores/RateLimitStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { dbQueryClickhouse, dbExecute } from "../shared/db/dbExecute";

const FREE_TIER_LIMIT = 10_000;
const FREE_TIER_CHECK_PROBABILITY = 0.01; // 1% of requests

export class RateLimitHandler extends AbstractLogHandler {
  private rateLimitStore: RateLimitStore;
  private rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log_v2"][];

  constructor(rateLimitStore: RateLimitStore) {
    super();
    this.rateLimitStore = rateLimitStore;
    this.rateLimitLogs = [];
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    if (!context.orgParams?.id) {
      return err("Organization ID not found in org params");
    }

    try {
      // Probabilistic free tier limit check (1% of requests)
      // - If freeLimitExceeded is null: check with 1% probability
      // - If freeLimitExceeded is current month: skip check (already exceeded this month)
      // - If freeLimitExceeded is old month: check with 1% probability (may have reset)
      if (
        context.orgParams.tier === "free" &&
        this.shouldCheckFreeTierLimit(context.orgParams.freeLimitExceeded)
      ) {
        await this.checkAndUpdateFreeTierLimit(context.orgParams.id);
      }

      const { data: isRateLimited, error: rateLimitErr } = this.rateLimitEntry(
        context.orgParams.id,
        context.orgParams.percentLog
      );

      if (rateLimitErr || isRateLimited === null) {
        return err(`Rate limit failed: ${rateLimitErr}`);
      }

      if (isRateLimited) {
        this.rateLimitLogs.push({
          request_id: context.message.log.request.id,
          organization_id: context.orgParams.id,
          rate_limit_created_at:
            context.message.log.request.requestCreatedAt.toISOString(),
        });
        return ok("Rate limited.");
        // Do not continue to the next handler if rate limited
      } else {
        return await super.handle(context);
      }
    } catch (error: any) {
      return err(
        `Error processing rate limit: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // "YYYY-MM"
  }

  private shouldCheckFreeTierLimit(freeLimitExceeded: string | null): boolean {
    if (freeLimitExceeded === null) {
      // Not exceeded - check with 1% probability
      return Math.random() < FREE_TIER_CHECK_PROBABILITY;
    }

    if (freeLimitExceeded === this.getCurrentMonth()) {
      // Already exceeded this month - skip check entirely
      return false;
    }

    // Old month - check with 1% probability to see if still over limit
    return Math.random() < FREE_TIER_CHECK_PROBABILITY;
  }

  private async checkAndUpdateFreeTierLimit(orgId: string): Promise<void> {
    try {
      const count = await this.get30DayRequestCount(orgId);
      if (count >= FREE_TIER_LIMIT) {
        // Over limit - set to current month
        await this.setFreeLimitExceeded(orgId, true);
        console.log(
          `[FreeTierLimit] Limit exceeded for org ${orgId}: ${count} requests in last 30 days`
        );
      } else {
        // Under limit - clear the flag
        await this.setFreeLimitExceeded(orgId, false);
        console.log(
          `[FreeTierLimit] Limit cleared for org ${orgId}: ${count} requests in last 30 days`
        );
      }
    } catch (error) {
      // Don't fail the request if the check fails
      console.error(`Error checking free tier limit for org ${orgId}:`, error);
    }
  }

  private async get30DayRequestCount(orgId: string): Promise<number> {
    const { data, error } = await dbQueryClickhouse<{ count: number }>(
      `SELECT COUNT(*) as count FROM request_response_rmt
       WHERE organization_id = {val_0:String}
       AND request_created_at >= now() - INTERVAL 30 DAY`,
      [orgId]
    );

    if (error || !data || data.length === 0) {
      console.error(`Error getting 30-day request count for org ${orgId}:`, error);
      return 0;
    }

    return data[0].count ?? 0;
  }

  private async setFreeLimitExceeded(
    orgId: string,
    exceeded: boolean
  ): Promise<void> {
    // Store as month string (e.g., "2026-01") or null
    const value = exceeded ? this.getCurrentMonth() : null;
    const { error } = await dbExecute(
      `UPDATE organization SET free_limit_exceeded = $1 WHERE id = $2`,
      [value, orgId]
    );

    if (error) {
      console.error(`Error setting free_limit_exceeded for org ${orgId}:`, error);
    }
  }

  public rateLimitEntry(
    orgId: string,
    percentLog: number
  ): GenericResult<boolean> {
    if (orgId && percentLog !== 100_000) {
      const random = Math.random() * 100_000;
      if (random > percentLog) {
        return ok(true);
      }
    }

    return ok(false);
  }

  public async handleResults(): PromiseGenericResult<string> {
    if (this.rateLimitLogs.length === 0) {
      return ok(`No rate limits to insert.`);
    }

    const result = await this.rateLimitStore.batchInsertRateLimits(
      this.rateLimitLogs
    );

    if (result.error) {
      return err(`Error inserting rate limits: ${result.error}`);
    }

    this.rateLimitLogs = [];
    return ok(`Rate limits inserted successfully.`);
  }
}
