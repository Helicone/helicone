import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { Result } from "@/packages/common/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

async function handler(
  options: HandlerWrapperOptions<Result<RequestsOverTime[], string>>,
) {
  const {
    req,
    res,
    userData: { orgId, userId },
  } = options;
  const {
    timeFilter,
    filter: userFilters,
    dbIncrement,
    timeZoneDifference,
    organizationId: orgIdFromBody,
  } = options.req.body as MetricsBackendBody;

  const organizationId = orgIdFromBody ?? orgId;

  const { error, data } = await dbExecute(
    `SELECT member FROM organization_member WHERE organization = $1 AND member = $2`,
    [organizationId, userId],
  );

  if (!data || data.length === 0 || error) {
    res.status(403).json({ error: "Unauthorized", data: null });
    return;
  }

  res.status(200).json(
    await getTotalRequestsOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId: organizationId ?? orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    }),
  );
}

export default withAuth(handler);
