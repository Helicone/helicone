// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { MetricsBackendBody } from "../../../components/templates/dashboard/useDashboardPage";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";

async function handler(
  options: HandlerWrapperOptions<Result<RequestsOverTime[], string>>
) {
  const {
    req,
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
    await getTotalRequestsOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
