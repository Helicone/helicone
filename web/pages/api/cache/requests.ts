import { getTopCachedRequestsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";
import { ISOTimeFilter, checkISOTimeFilter } from "@/services/lib/filters/filterDefs";

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
  const validatedTimeFilter = checkISOTimeFilter(timeFilter);
  if (validatedTimeFilter instanceof Error) {
    return res.status(400).json({ error: validatedTimeFilter.message, data: null });
  }
  res.status(200).json(await getTopCachedRequestsClickhouse(orgId, validatedTimeFilter));
}

export default withAuth(handler);
