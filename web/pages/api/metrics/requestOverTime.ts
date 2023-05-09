// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";

async function handler(
  options: HandlerWrapperOptions<Result<RequestsOverTime[], string>>
) {
  await getTimeDataHandler(options, (d) =>
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

export default withAuth(handler);
