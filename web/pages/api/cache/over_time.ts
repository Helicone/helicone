import { getModelUsageOverTime } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getSomeDataOverTime } from "../../../lib/api/metrics/timeDataHandlerWrapper";

import { UnPromise } from "../../../lib/tsxHelpers";

export function getModelUsageOverTimeBackFill(orgId: string) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return getSomeDataOverTime(
    {
      dbIncrement: "day",
      orgId: orgId,
      timeFilter: {
        start: oneMonthAgo.toISOString(),
        end: new Date().toISOString(),
      },
      timeZoneDifference: 0,
      userFilter: "all",
    },
    getModelUsageOverTime,
    {
      initial: {} as { [key: string]: number },
      reducer: (acc, d) => {
        if (!acc[d.model]) {
          acc[d.model] = 0;
        }
        acc[d.model] += +d.sum_tokens;
        return acc;
      },
    }
  );
}

async function handler(
  options: HandlerWrapperOptions<
    UnPromise<ReturnType<typeof getModelUsageOverTimeBackFill>>
  >
) {
  const res = await getModelUsageOverTimeBackFill(options.userData.orgId);

  options.res.status(200).json(res);
}

export default withAuth(handler);
