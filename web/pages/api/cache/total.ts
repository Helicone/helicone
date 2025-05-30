import { ISOTimeFilter } from "@/services/lib/filters/filterDefs";
import { getCacheCountClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { timeFilter } = req.body as {
    timeFilter: ISOTimeFilter;
  };
  res.status(200).json(await getCacheCountClickhouse(orgId, timeFilter));
}

export default withAuth(handler);
