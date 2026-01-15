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
const FREE_TIER_RECOVERY_CHECK_PROBABILITY = 0.001; // 0.1% of requests for recovery check

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
      if (
        context.orgParams.tier === "free" &&
        !context.orgParams.freeLimitExceeded &&
        Math.random() < FREE_TIER_CHECK_PROBABILITY
      ) {
        await this.checkAndSetFreeTierLimit(context.orgParams.id);
      }

      // Recovery check: periodically verify if limit-exceeded orgs are still over limit
      // This handles cases where old requests aged out of the 30-day window
      if (
        context.orgParams.tier === "free" &&
        context.orgParams.freeLimitExceeded &&
        Math.random() < FREE_TIER_RECOVERY_CHECK_PROBABILITY
      ) {
        await this.checkAndResetFreeTierLimit(context.orgParams.id);
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

  private async checkAndSetFreeTierLimit(orgId: string): Promise<void> {
    try {
      const count = await this.get30DayRequestCount(orgId);
      if (count >= FREE_TIER_LIMIT) {
        await this.setFreeLimitExceeded(orgId, true);
        console.log(
          `[FreeTierLimit] Limit exceeded for org ${orgId}: ${count} requests in last 30 days`
        );
      }
    } catch (error) {
      // Don't fail the request if the check fails
      console.error(`Error checking free tier limit for org ${orgId}:`, error);
    }
  }

  // Recovery mechanism: reset the flag if org is now under the limit
  // (e.g., old requests aged out of the 30-day rolling window)
  private async checkAndResetFreeTierLimit(orgId: string): Promise<void> {
    try {
      const count = await this.get30DayRequestCount(orgId);
      if (count < FREE_TIER_LIMIT) {
        await this.setFreeLimitExceeded(orgId, false);
        console.log(
          `[FreeTierLimit] Limit reset for org ${orgId}: ${count} requests in last 30 days (under ${FREE_TIER_LIMIT} limit)`
        );
      }
    } catch (error) {
      // Don't fail the request if the check fails
      console.error(`Error checking free tier recovery for org ${orgId}:`, error);
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
    const { error } = await dbExecute(
      `UPDATE organization SET free_limit_exceeded = $1 WHERE id = $2`,
      [exceeded, orgId]
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
