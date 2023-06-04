import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalCost } from "../../../lib/api/property/totalCosts";
import { Result, resultsAll } from "../../../lib/result";

async function handler(options: HandlerWrapperOptions<Result<number, string>>) {
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

  if (!filter) {
    res.status(400).json({ error: "Bad request", data: null });
    return;
  }

  const metrics = await getTotalCost(filter, timeFilter, userData.orgId);
  res.status(200).json(metrics);
}

export default withAuth(handler);
