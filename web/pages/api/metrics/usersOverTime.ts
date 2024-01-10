import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getUsersOverTime } from "../../../lib/api/metrics/getUsersOverTime";
import { Result } from "../../../lib/shared/result";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";

export interface UsersOverTime {
  count: number;
  time: Date;
}

async function handler(
  options: HandlerWrapperOptions<Result<UsersOverTime[], string>>
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
    await getUsersOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
