import { PTB_ENABLED_FEATURE } from "../../../../../packages/common/billing/ptbAccess";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";

export async function hasPtbAccess(
  orgId: string,
): Promise<Result<boolean, string>> {
  const result = await dbExecute<{ id: string }>(
    `SELECT id
     FROM feature_flags
     WHERE org_id = $1 AND feature = $2
     LIMIT 1`,
    [orgId, PTB_ENABLED_FEATURE],
  );

  if (result.error) {
    return err(result.error);
  }

  return ok(Boolean(result.data?.length));
}
