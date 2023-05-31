// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { MetricsBackendBody } from "../../../components/templates/dashboard/useDashboardPage";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import { Result } from "../../../lib/result";

export interface ErrorOverTime {
  count: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<ErrorOverTime[], string>>
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
    await getTotalRequestsOverTime({
      timeFilter,
      userFilter: {
        left: userFilters,
        operator: "and",
        right: {
          response_copy_v2: {
            status: {
              "not-equals": 200,
            },
          },
        },
      },
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
