import { getTotalSavingsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import { Result, resultMap } from "@/packages/common/result";
import { ISOTimeFilter, checkISOTimeFilter } from "@/services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { timeFilter } = req.body as {
    timeFilter: ISOTimeFilter;
  };
  
  const validatedTimeFilter = checkISOTimeFilter(timeFilter);
  if (validatedTimeFilter instanceof Error) {
    return res.status(400).json({ error: validatedTimeFilter.message, data: null });
  }

  res
    .status(200)
    .json(
      resultMap(
        await getTotalSavingsClickhouse(orgId, validatedTimeFilter),
        (modelMetrics) =>
          modelMetrics.reduce(
            (acc, modelMetric) => acc + modelCost(modelMetric),
            0
          )
      )
    );
}

export default withAuth(handler);
