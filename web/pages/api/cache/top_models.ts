import { getTopModelUsageClickhouse } from "../../../lib/api/cache/stats";
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
  UnPromise<ReturnType<typeof getTopModelUsageClickhouse>>
>) {
  res.status(200).json(await getTopModelUsageClickhouse(orgId, "all"));
}

export default withAuth(handler);
