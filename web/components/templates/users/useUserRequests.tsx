import { DashboardPageData } from "../dashboard/useDashboardPage";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { RequestsOverTime } from "../../../lib/timeCalculations/fetchTimeData";
import { Result, resultMap } from "../../../lib/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { filterUITreeToFilterNode } from "../../../services/lib/filters/uiFilterRowTree";

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
  filterUITreeToFilterNode(filterMap, uiFilters);
  // const userFilters = filterUIToFilterLeafs(filterMap).concat([
  //   {
  //     request_response_rmt: {
  //       user_id: {
  //         equals: userId,
  //       },
  //     },
  //   },
  // ]);

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: "all" as FilterNode,
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
