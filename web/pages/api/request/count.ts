// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  getRequestCount,
  getRequestCountCached,
} from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter, isCached } = req.body as {
    filter: FilterNode;
    isCached: boolean;
  };
  const metrics = isCached
    ? await getRequestCountCached(orgId, filter)
    : await getRequestCount(orgId, filter);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
