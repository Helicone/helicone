import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { BaseManager } from "./BaseManager";

export class PlaygroundManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async setPlaygroundRequestsThroughHelicone(
    orgId: string,
    requestsThroughHelicone: boolean,
  ): Promise<Result<string, string>> {
    const { data, error } = await dbExecute<{ id: string }>(
      `UPDATE organization SET playground_helicone = $1 WHERE id = $2`,
      [requestsThroughHelicone, this.authParams.organizationId],
    );
    if (error) {
      return err(`Failed to update organization playground setting: ${error}`);
    }
    return ok("Requests through Helicone");
  }

  async getRequestsThroughHelicone(
    orgId: string,
  ): Promise<Result<boolean, string>> {
    const { data, error } = await dbExecute<{ playground_helicone: boolean }>(
      `SELECT playground_helicone FROM organization WHERE id = $1`,
      [orgId],
    );
    if (error) {
      return err(`Failed to get organization playground setting: ${error}`);
    }

    if (!data || data.length === 0) {
      return err(`Organization not found`);
    }

    return ok(data[0].playground_helicone);
  }
}
