import { useQuery } from "@tanstack/react-query";
import { DashboardPageData } from "../dashboard/useDashboardPage";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { Result, resultMap } from "../../../lib/result";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";

export const useUserRequests = (
  {
    timeFilter,
    uiFilters,
    apiKeyFilter,
    timeZoneDifference,
    dbIncrement,
  }: DashboardPageData,
  userId: string
) => {
  const filterMap = DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[];

  const userFilters = filterUIToFilterLeafs(filterMap, uiFilters).concat([
    {
      response_copy_v3: {
        user_id: {
          equals: userId,
        },
      },
    },
  ]);

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters,
    dbIncrement,
    timeZoneDifference,
  };

  const overTimeData = {
    requests: useBackendMetricCall<Result<RequestsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/requestOverTime",
      key: "requestOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
  };

  return { overTimeData };
};
