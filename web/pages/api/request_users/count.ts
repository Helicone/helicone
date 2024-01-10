// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { userMetricsCount } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter } = req.body as {
    filter: FilterNode;
  };
  const metrics = await userMetricsCount(orgId, filter);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
export default withAuth(handler);
