import {
  GenericResult,
  PromiseGenericResult,
  err,
  ok,
} from "../modules/result";
import { ClickhouseDB } from "../shared/db/dbExecute";
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

  async handle(context: HandlerContext): Promise<void> {
    const { data: isRateLimited, error: rateLimitErr } =
      this.rateLimitEntry(context);

    if (rateLimitErr || isRateLimited === null) {
      console.log("Rate limit failed:", rateLimitErr || "Rate limited");
    } else if (context.orgParams?.id && isRateLimited) {
      this.rateLimitLogs.push({
        organization_id: context.orgParams?.id || "",
        created_at: new Date().toISOString(), // TODO: Use the actual request time
      });
    } else {
      await super.handle(context);
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

  public async handleResult(): PromiseGenericResult<string> {
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
