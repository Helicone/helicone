// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import { getCostOverTime } from "../../../lib/api/metrics/getCostOverTime";

import { getModelUsageOverTime } from "../../../lib/api/metrics/getModelUsageOverTime";
import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";

export interface CostOverTime {
  cost: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<CostOverTime[], string>>
) {
  await getTimeDataHandler(options, (d) =>
    getSomeDataOverTime(d, getCostOverTime, {
      reducer: (acc, d) => ({
        cost: acc.cost + d.cost,
      }),
      initial: {
        cost: 0,
      },
    })
  );
}
export default withAuth(handler);
