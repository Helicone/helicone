import { statusCodesLastMonth } from "../../../lib/api/error/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<UnPromise<ReturnType<typeof statusCodesLastMonth>>>) {
  res.status(200).json(await statusCodesLastMonth(orgId, "all"));
}

export default withAuth(handler);
