import { ClickhouseDB } from "../db/ClickhouseWrapper";
import { ok, PromiseGenericResult, err, GenericResult } from "../shared/result";
import { RateLimitStore } from "../stores/RateLimitStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class RateLimitHandler extends AbstractLogHandler {
  private rateLimitStore: RateLimitStore;
  private rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log"][];

  constructor(rateLimitStore: RateLimitStore) {
    super();
    this.rateLimitStore = rateLimitStore;
    this.rateLimitLogs = [];
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    console.log(`RateLimitHandler: ${context.message.log.request.id}`);
    try {
      const { data: isRateLimited, error: rateLimitErr } =
        this.rateLimitEntry(context);

      if (rateLimitErr || isRateLimited === null) {
        return err(`Rate limit failed: ${rateLimitErr}`);
      } else if (context.orgParams?.id && isRateLimited) {
        this.rateLimitLogs.push({
          organization_id: context.orgParams?.id || "",
          created_at:
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

  public rateLimitEntry(context: HandlerContext): GenericResult<boolean> {
    if (context.orgParams?.id && context.orgParams?.percentLog !== 100_000) {
      const random = Math.random() * 100_000;
      if (random > context.orgParams.percentLog) {
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
