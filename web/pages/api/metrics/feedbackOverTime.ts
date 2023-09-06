import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import {
  FeedbackOverTime,
  getFeedbackOverTime,
} from "../../../lib/api/metrics/getFeedbackOverTime";
import { Result } from "../../../lib/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

async function handler(
  options: HandlerWrapperOptions<Result<FeedbackOverTime[], string>>
) {
  const {
    res,
    userData: { orgId },
  } = options;

  const {
    timeFilter,
    filter: userFilters,
    dbIncrement,
    timeZoneDifference,
  } = options.req.body as MetricsBackendBody;

  res.status(200).json(
    await getFeedbackOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
