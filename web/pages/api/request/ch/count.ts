import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { getRequestCountClickhouse } from "../../../../lib/api/request/request";
import { Result } from "@helicone-package/common/result";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter } = req.body as {
    filter: FilterNode;
  };

  const count = await getRequestCountClickhouse(orgId, filter);
  res.status(count.error === null ? 200 : 500).json(count);
}

export default withAuth(handler);
