import { getTopCachedRequestsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";
import { TimeFilterSchema } from "@helicone-package/filters/helpers";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<
  UnPromise<ReturnType<typeof getTopCachedRequestsClickhouse>>
>) {
  const parsedBody = TimeFilterSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: parsedBody.error.message, data: null });
  }
  res
    .status(200)
    .json(
      await getTopCachedRequestsClickhouse(orgId, parsedBody.data.timeFilter),
    );
}

export default withAuth(handler);
