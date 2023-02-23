// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<CostOverTime[], string>>
) {
  await getTimeDataHandler(req, res, (d) =>
    getSomeDataOverTime(d, getModelUsageOverTime, {
      reducer: (acc, d) => ({ cost: acc.cost + modelCost(d) }),
      initial: { cost: 0 },
    })
  );
}
