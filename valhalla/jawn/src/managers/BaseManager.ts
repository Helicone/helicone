import { DBQueryTimer } from "../lib/db/DBQueryTimer";
import { AuthParams } from "../packages/common/auth/types";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

export class BaseManager {
  protected queryTimer: DBQueryTimer;
  constructor(protected authParams: AuthParams) {
    this.queryTimer = new DBQueryTimer({
      enabled: true,
      apiKey: SecretManager.getSecret("DATADOG_API_KEY") ?? "",
      endpoint: process.env.DATADOG_ENDPOINT ?? "",
    });
  }
}
