import { ClickhouseDB, clickhouseDb } from "../db/ClickhouseWrapper";
import { PromiseGenericResult, err, ok } from "../shared/result";

export class RateLimitStore {
  public async batchInsertRateLimits(
    rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log_v2"][]
  ): PromiseGenericResult<string> {
    const result = await clickhouseDb.dbInsertClickhouse(
      "rate_limit_log_v2",
      rateLimitLogs
    );

    if (result.error || !result.data) {
      return err(`Error inserting rate limit logs: ${result.error}`);
    }

    return ok(result.data);
  }
}
