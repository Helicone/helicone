import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import {
  getThreatsOverTime,
  ThreatsOverTime,
} from "../../../lib/api/metrics/getThreatsOverTime";
import { Result } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

async function handler(
  options: HandlerWrapperOptions<Result<ThreatsOverTime[], string>>
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
    await getThreatsOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
