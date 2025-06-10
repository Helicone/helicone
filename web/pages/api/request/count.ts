// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getRequestCountClickhouse } from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { RequestResponseRMTDerivedTable } from "@helicone-package/filters/filterDefs";
async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter, isCached, baseTable = "request_response_rmt" } = req.body as {
    filter: FilterNode;
    isCached: boolean;
    baseTable?: RequestResponseRMTDerivedTable;
  };
  const metrics = await getRequestCountClickhouse(orgId, filter, isCached, baseTable);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
