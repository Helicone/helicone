import { getTimeSavedClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { ISOTimeFilter } from "@/services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { timeFilter } = req.body as {
    timeFilter: ISOTimeFilter;
  };
  res.status(200).json(await getTimeSavedClickhouse(orgId, timeFilter));
}

export default withAuth(handler);
