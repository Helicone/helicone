// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { modelCost } from "../../../lib/api/metrics/costCalc";

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
    getSomeDataOverTime(d, getModelUsageOverTime, {
      reducer: (acc, d) => ({ cost: acc.cost + modelCost(d) }),
      initial: { cost: 0 },
    })
  );
}

export default withAuth(handler);
