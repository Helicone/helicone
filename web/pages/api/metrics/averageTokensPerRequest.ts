import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { resultsAll } from "../../../lib/result";
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
