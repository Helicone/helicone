// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { userMetrics } from "../../../lib/api/users/users";
import { UserMetric } from "../../../lib/api/users/UserMetric";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafUsers } from "../../../services/lib/sorts/users/sorts";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<UserMetric[], string>>) {
  const { filter, offset, limit, sort, timeZoneDifference } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafUsers;
    timeZoneDifference: number;
  };
  const { error: metricsError, data: metrics } = await userMetrics(
    orgId,
    filter,
    offset,
    limit,
    sort,
    timeZoneDifference
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: metrics });
}

export default withAuth(handler);
