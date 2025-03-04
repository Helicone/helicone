import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getAggregatedKeyMetrics } from "../../../lib/api/property/aggregatedKeyMetrics";
import { resultsAll } from "../../../lib/result";
import { UnPromise } from "../../../lib/tsxHelpers";

async function handler(
  options: HandlerWrapperOptions<
    UnPromise<ReturnType<typeof getAggregatedKeyMetrics>>
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

  const metrics = await getAggregatedKeyMetrics(
    filter,
    timeFilter,
    userData.orgId,
    req.body.limit,
    req.body.sortKey,
    req.body.sortDirection
  );
  res.status(200).json(metrics);
}

export default withAuth(handler);
