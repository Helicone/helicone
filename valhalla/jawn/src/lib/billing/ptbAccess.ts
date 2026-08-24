import {
  PTB_BLOCKED_FEATURE,
  PTB_ENABLED_FEATURE,
} from "../../../../../packages/common/billing/ptbAccess";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";

export async function isPtbBlocked(
  orgId: string,
): Promise<Result<boolean, string>> {
  const result = await dbExecute<{ feature: string }>(
    `SELECT feature
     FROM feature_flags
     WHERE org_id = $1 AND feature = ANY($2::text[])`,
    [orgId, [PTB_BLOCKED_FEATURE, PTB_ENABLED_FEATURE]],
  );

  if (result.error) {
    return err(result.error);
  }

  const features = result.data?.map((row) => row.feature) ?? [];

  return ok(
    features.includes(PTB_BLOCKED_FEATURE) ||
      !features.includes(PTB_ENABLED_FEATURE),
  );
}
