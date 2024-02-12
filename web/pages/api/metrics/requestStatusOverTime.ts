// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import { Result } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

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
  const totalRequests = await getTotalRequestsOverTime(
    {
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    },
    ["response_copy_v3.status as status"]
  );

  res.status(200).json(totalRequests);
}

export default withAuth(handler);
