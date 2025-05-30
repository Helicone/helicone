import { getTimeSavedClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { TimeFilterSchema } from "@/services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const parsedBody = TimeFilterSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.message, data: null });
  }
  res.status(200).json(await getTimeSavedClickhouse(orgId, parsedBody.data.timeFilter));
}

export default withAuth(handler);
