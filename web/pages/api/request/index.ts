import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../../../lib/shared/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/shared/result";
import { FilterNode } from "../../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../../lib/shared/sorts/requests/sorts";
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
        supabaseServer
      )
    : await getRequests(orgId, filter, offset, limit, sort, supabaseServer);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
