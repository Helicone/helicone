// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getDailyActiveUsers } from "../../../lib/api/users/dau";
import { UnPromise } from "../../../lib/tsxHelpers";
import { FilterNode } from "../../../lib/shared/filters/filterDefs";

export type DailyActiveUsers = UnPromise<
  ReturnType<typeof getDailyActiveUsers>
>;

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<DailyActiveUsers>) {
  const { filter } = req.body as {
    filter: FilterNode;
  };
  const metrics = await getDailyActiveUsers(orgId, filter);

  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
export default withAuth(handler);
