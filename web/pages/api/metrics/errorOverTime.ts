// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getErrorOverTime } from "../../../lib/api/metrics/getErrorOverTime";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import {
  getSomeDataOverTime,
  getTimeDataHandler,
} from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";

export interface ErrorOverTime {
  count: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<ErrorOverTime[], string>>
) {
  await getTimeDataHandler(options, (d) =>
    getSomeDataOverTime(d, getErrorOverTime, {
      reducer: (acc, d) => ({ count: acc.count + d.count }),
      initial: { count: 0 },
    })
  );
}

export default withAuth(handler);
