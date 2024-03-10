import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { supabaseServer } from "../../../lib/supabaseServer";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<HeliconeRequest[], string>>) {
  const { filter, offset, limit, sort, isCached } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafRequest;
    isCached: boolean;
  };

  const metrics = isCached
    ? await getRequestsCached(
        orgId,
        filter,
        offset,
        limit,
        sort,
        supabaseServer()
      )
    : await getRequests(orgId, filter, offset, limit, sort, supabaseServer());
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
