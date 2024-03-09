import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";

import { getXOverTime } from "../../../lib/api/metrics/getXOverTime";
import { DataOverTimeRequest } from "../../../lib/api/metrics/timeDataHandlerWrapper";

import { Result, resultMap } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

export interface TokensOverTime {
  prompt_tokens: number;
  completion_tokens: number;
  time: Date;
}

export async function getTokensOverTime(
  data: DataOverTimeRequest
): Promise<Result<TokensOverTime[], string>> {
  const res = await getXOverTime<{
    prompt_tokens: number;
    completion_tokens: number;
  }>(
    data,
    `sum(request_response_log.prompt_tokens) AS prompt_tokens,
     sum(request_response_log.completion_tokens) AS completion_tokens`
  );
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      prompt_tokens: Number(d.prompt_tokens),
      completion_tokens: Number(d.completion_tokens),
    }))
  );
}

async function handler(
  options: HandlerWrapperOptions<Result<TokensOverTime[], string>>
) {
  const {
    res,
    userData: { orgId },
  } = options;
  const {
    timeFilter,
    filter: userFilters,
    dbIncrement,
    timeZoneDifference,
  } = options.req.body as MetricsBackendBody;

  res.status(200).json(
    await getTokensOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}
export default withAuth(handler);
