import { DBQueryTimer } from "../lib/db/DBQueryTimer";
import { AuthParams } from "../packages/common/auth/types";

export class BaseManager {
  protected queryTimer: DBQueryTimer;
  constructor(protected authParams: AuthParams) {
    this.queryTimer = new DBQueryTimer({
      enabled: true,
      apiKey: process.env.DATADOG_API_KEY ?? "",
      endpoint: process.env.DATADOG_ENDPOINT ?? "",
    });
  }
}
