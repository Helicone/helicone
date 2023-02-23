// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<RequestsOverTime[], string>>
) {
  await getTimeDataHandler(req, res, (d) =>
    getSomeDataOverTime(d, getTotalRequestsOverTime, {
      reducer: (acc, d) => ({
        count: acc.count + d.count,
      }),
      initial: {
        count: 0,
      },
    })
  );
}
