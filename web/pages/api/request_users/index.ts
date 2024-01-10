// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UserMetric, userMetrics } from "../../../lib/api/users/users";
import { Result } from "../../../lib/shared/result";
import { FilterNode } from "../../../lib/shared/filters/filterDefs";
import { SortLeafUsers } from "../../../lib/shared/sorts/users/sorts";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<UserMetric[], string>>) {
  const { filter, offset, limit, sort } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafUsers;
  };
  const { error: metricsError, data: metrics } = await userMetrics(
    orgId,
    filter,
    offset,
    limit,
    sort
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: metrics });
}

export default withAuth(handler);
