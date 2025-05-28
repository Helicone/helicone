import { getTopCachedRequestsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<
  UnPromise<ReturnType<typeof getTopCachedRequestsClickhouse>>
>) {
  res.status(200).json(await getTopCachedRequestsClickhouse(orgId, "all"));
}

export default withAuth(handler);
