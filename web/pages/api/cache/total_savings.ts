import { getModelMetrics } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import { Result, resultMap } from "../../../lib/result";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  res
    .status(200)
    .json(
      resultMap(await getModelMetrics(orgId, "all"), (modelMetrics) =>
        modelMetrics.reduce(
          (acc, modelMetric) => acc + modelCost(modelMetric),
          0
        )
      )
    );
}

export default withAuth(handler);
