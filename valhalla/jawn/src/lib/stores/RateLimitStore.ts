import { ClickhouseClientWrapper, ClickhouseDB } from "../db/ClickhouseWrapper";
import { PromiseGenericResult, err, ok } from "../shared/result";

export class RateLimitStore {
  private clickhouse: ClickhouseClientWrapper;

  constructor(clickhouse: ClickhouseClientWrapper) {
    this.clickhouse = clickhouse;
  }

  public async batchInsertRateLimits(
    rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log_v2"][]
  ): PromiseGenericResult<string> {
    const result = await this.clickhouse.dbInsertClickhouse(
      "rate_limit_log_v2",
      rateLimitLogs
    );

    if (result.error || !result.data) {
      return err(`Error inserting rate limit logs: ${result.error}`);
    }

    return ok(result.data);
  }
}
