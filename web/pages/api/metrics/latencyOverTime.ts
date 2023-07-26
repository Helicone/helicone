// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getLatencyOverTime } from "../../../lib/api/metrics/getLatencyOverTime";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import { Result } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

export interface LatencyOverTime {
  duration: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<LatencyOverTime[], string>>
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

  const resp = await getLatencyOverTime({
    timeFilter,
    userFilter: userFilters,
    orgId,
    dbIncrement: dbIncrement ?? "hour",
    timeZoneDifference,
  });

  console.log(resp);
  res.status(200).json(
    resp
    // await getLatencyOverTime({
    //   timeFilter,
    //   userFilter: userFilters,
    //   orgId,
    //   dbIncrement: dbIncrement ?? "hour",
    //   timeZoneDifference,
    // })
  );
}

export default withAuth(handler);
