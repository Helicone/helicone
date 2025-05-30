import { getTopCachedRequestsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";
import { ISOTimeFilter } from "@/services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<
  UnPromise<ReturnType<typeof getTopCachedRequestsClickhouse>>
>) {
  const { timeFilter } = req.body as {
    timeFilter: ISOTimeFilter;
  };
  res.status(200).json(await getTopCachedRequestsClickhouse(orgId, timeFilter));
}

export default withAuth(handler);
