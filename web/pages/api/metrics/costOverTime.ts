import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getCostOverTime } from "../../../lib/api/metrics/getCostOverTime";

import { Result } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

export interface CostOverTime {
  cost: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<CostOverTime[], string>>
) {
  const {
    res,
    userData: { orgId },
  } = options;
  const {
    timeFilter,
    filter: userFilters,
    dbIncrement,
    timeZoneDifference,
  } = options.req.body as MetricsBackendBody;

  res.status(200).json(
    await getCostOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}
export default withAuth(handler);
