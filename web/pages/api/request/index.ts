import { HeliconeRequest, getRequests } from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<HeliconeRequest[], string>>) {
  const { filter, offset, limit, sort } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafRequest;
  };

  const metrics = await getRequests(orgId, filter, offset, limit, sort);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
