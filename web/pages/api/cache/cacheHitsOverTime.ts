import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";

import { Result } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";
import {
  CacheHitsOverTime,
  getCacheHitsOverTime,
} from "./getCacheHitsOverTime";

async function handler(
  options: HandlerWrapperOptions<Result<CacheHitsOverTime[], string>>
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
    await getCacheHitsOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "day",
      timeZoneDifference,
    })
  );
}
export default withAuth(handler);
