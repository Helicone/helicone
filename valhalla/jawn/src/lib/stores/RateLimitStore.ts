import { PromiseGenericResult, err, ok } from "../modules/result";
import { ClickhouseDB, dbInsertClickhouse } from "../shared/db/dbExecute";

export class RateLimitStore {
  constructor() {}

  public async batchInsertRateLimits(
    rateLimitLogs: ClickhouseDB["Tables"]["rate_limit_log"][]
  ): PromiseGenericResult<string> {
    const result = await dbInsertClickhouse("rate_limit_log", rateLimitLogs);

    if (result.error || !result.data) {
      return err(`Error inserting rate limit logs: ${result.error}`);
    }

    return ok(result.data);
  }
}
