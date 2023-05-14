import { getErrorsOverTime } from "../../../lib/api/error/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getSomeDataOverTime } from "../../../lib/api/metrics/timeDataHandlerWrapper";

import { UnPromise } from "../../../lib/tsxHelpers";

export function getErrorOverTimeBackFill(orgId: string) {
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
    getErrorsOverTime,
    {
      initial: {} as { [key: string]: number },
      reducer: (acc, d) => {
        if (d.error_code === 200 || d.error_code === 0) {
          return acc;
        }
        if (!acc[d.error_code]) {
          acc[d.error_code] = 0;
        }
        acc[d.error_code] += +d.count;
        return acc;
      },
    }
  );
}

async function handler(
  options: HandlerWrapperOptions<
    UnPromise<ReturnType<typeof getErrorOverTimeBackFill>>
  >
) {
  const res = await getErrorOverTimeBackFill(options.userData.orgId);

  options.res.status(200).json(res);
}

export default withAuth(handler);
