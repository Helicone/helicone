import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getAverageLatency } from "../../../lib/api/metrics/averageLatency";
import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { getTotalCost } from "../../../lib/api/metrics/totalCosts";
import { getTotalRequests } from "../../../lib/api/metrics/totalRequests";
import { Result, resultsAll } from "../../../lib/shared/result";
import { UnPromise } from "../../../lib/tsxHelpers";

async function handler(
  options: HandlerWrapperOptions<
    UnPromise<ReturnType<typeof getTokensPerRequest>>
  >
) {
  const { req, res, userData } = options;
  const { data: filterData, error: filterError } = resultsAll([
    options.body.getFilter(),
    options.body.getTimeFilter(),
  ]);
  if (filterError !== null) {
    res.status(400).json({ error: filterError, data: null });
    return;
  }
  const [filter, timeFilter] = filterData;

  const metrics = await getTokensPerRequest(filter, timeFilter, userData.orgId);
  res.status(200).json(metrics);
}

export default withAuth(handler);
