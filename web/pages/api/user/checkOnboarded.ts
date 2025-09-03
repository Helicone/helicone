import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { logger } from "@/lib/telemetry/logger";
import { getRequestCountClickhouse } from "../../../lib/api/request/request";
import { Result } from "@/packages/common/result";

async function checkAndUpdateOrgs(orgId: string): Promise<boolean> {
  const count = (await getRequestCountClickhouse(orgId, {} as any)).data ?? 0;
  if (count > 0) {
    const { error } = await dbExecute(
      `UPDATE organization SET has_onboarded = true WHERE id = $1`,
      [orgId],
    );
    if (error) {
      logger.error(
        {
          error,
        },
        "Error updating org",
      );
      return false;
    }
    logger.info({ orgId }, "Updated org");
    return true;
  }
  return false;
}

async function handler({
  res,
  userData: { orgHasOnboarded, orgId },
}: HandlerWrapperOptions<Result<boolean, string>>) {
  if (orgHasOnboarded) {
    res.status(200).json({ error: null, data: true });
    return;
  }
  const data = await checkAndUpdateOrgs(orgId);
  if (data) {
    res.status(200).json({ error: null, data });
  } else {
    res.status(500).json({ error: "Not Updated", data: null });
  }
}

export default withAuth(handler);
