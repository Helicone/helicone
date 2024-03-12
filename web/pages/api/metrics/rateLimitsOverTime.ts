import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getRateLimitOverTime } from "../../../lib/api/metrics/getRateLimitOverTime";
import { Result } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

export interface RateLimitOverTime {
  count: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<RateLimitOverTime[], string>>
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
    await getRateLimitOverTime({
      timeFilter,
      userFilter: {},
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
