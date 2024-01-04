import { getModelUsageOverTime } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getXOverTimeCacheHits } from "../../../lib/api/metrics/getXOverTime";
import { getSomeDataOverTime } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { resultMap } from "../../../lib/result";
import { CLICKHOUSE_PRICE_CALC } from "../../../lib/sql/constants";

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
  // const res = await getXOverTimeCacheHits<{
  //   cost: number;
  // }>(data, `${CLICKHOUSE_PRICE_CALC("response_copy_v3")} AS cost`);
  // return resultMap(res, (resData) =>
  //   resData.map((d) => ({
  //     time: new Date(new Date(d.created_at_trunc).getTime()),
  //     cost: Number(d.cost),
  //   }))
  // );

  options.res.status(200).json(res);
}

export default withAuth(handler);
