// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getRequestCountClickhouse } from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";
async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter, isCached } = req.body as {
    filter: FilterNode;
    isCached: boolean;
  };
  const metrics = await getRequestCountClickhouse(orgId, filter, isCached);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
