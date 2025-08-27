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
