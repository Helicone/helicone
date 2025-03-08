// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { getTotalRequestsOverTime } from "../../../lib/api/metrics/getRequestOverTime";
import { Result } from "../../../lib/result";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { MetricsBackendBody } from "../../../services/hooks/useBackendFunction";
import {
  isLightweightMode,
  mockDashboardData,
  simulateApiDelay,
} from "../../../utils/devMocks";

async function handler(
  options: HandlerWrapperOptions<Result<RequestsOverTime[], string>>
) {
  const {
    req,
    res,
    userData: { orgId, userId },
  } = options;

  // Use mock data in lightweight development mode
  if (isLightweightMode) {
    await simulateApiDelay();

    // Convert our mock data to the expected format
    const mockData: RequestsOverTime[] = mockDashboardData.requestsOverTime.map(
      (item) => ({
        count: item.count,
        time: new Date(item.date),
      })
    );

    return res.status(200).json({ data: mockData, error: null });
  }

  const {
    timeFilter,
    filter: userFilters,
    dbIncrement,
    timeZoneDifference,
    organizationId,
  } = options.req.body as MetricsBackendBody;

  if (organizationId) {
    await getSupabaseServer()
      .from("organization_member")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("member_id", userId)
      .then((org_res) => {
        if (org_res.data?.length === 0) {
          res.status(403).json({ error: "Unauthorized", data: null });
        }
      });
  }

  res.status(200).json(
    await getTotalRequestsOverTime({
      timeFilter,
      userFilter: userFilters,
      orgId: organizationId ?? orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    })
  );
}

export default withAuth(handler);
