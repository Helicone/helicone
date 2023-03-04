// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import { getErrorOverTime } from "../../../lib/api/metrics/getErrorOverTime";

import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";

export interface ErrorOverTime {
  count: number;
  time: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<ErrorOverTime[], string>>
) {
  await getTimeDataHandler(req, res, (d) =>
    getSomeDataOverTime(d, getErrorOverTime, {
      reducer: (acc, d) => ({ count: acc.count + d.count }),
      initial: { count: 0 },
    })
  );
}
