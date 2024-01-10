import { UseQueryResult } from "@tanstack/react-query";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, resultMap } from "../../../lib/result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";

import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { UnPromise } from "../../../lib/tsxHelpers";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import {
  FilterLeaf,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { LatencyOverTime } from "../../../pages/api/metrics/latencyOverTime";
import { UsersOverTime } from "../../../pages/api/metrics/usersOverTime";

export async function fetchDataOverTime<T>(
  timeFilter: {
    start: Date;
    end: Date;
  },
  userFilters: FilterLeaf[],
  dbIncrement: TimeIncrement,
  path: string
) {
  const body: OverTimeRequestQueryParams = {
    timeFilter: {
      start: timeFilter.start.toISOString(),
      end: timeFilter.end.toISOString(),
    },
    userFilters,
    dbIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };
  return await fetch(`/api/metrics/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((res) => res.json() as Promise<Result<T[], string>>);
}

export interface DashboardPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  uiFilters: UIFilterRow[];
  apiKeyFilter: string | null;
  timeZoneDifference: number;
  dbIncrement: TimeIncrement;
}

export const useDashboardPage = ({
  timeFilter,
  uiFilters,
  apiKeyFilter,
  timeZoneDifference,
  dbIncrement,
}: DashboardPageData) => {
  const filterMap = DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[];

  const userFilters =
    apiKeyFilter !== null
      ? filterUIToFilterLeafs(filterMap, uiFilters).concat([
          {
            response_copy_v3: {
              auth_hash: {
                equals: apiKeyFilter,
              },
            },
          },
        ])
      : filterUIToFilterLeafs(filterMap, uiFilters);

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters,
    dbIncrement,
    timeZoneDifference,
  };

  const overTimeData = {
    errors: useBackendMetricCall<Result<ErrorOverTime[], string>>({
      params,
      endpoint: "/api/metrics/errorOverTime",
      key: "errorOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
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
    requestsWithStatus: useBackendMetricCall<
      Result<(RequestsOverTime & { status: number })[], string>
    >({
      params,
      endpoint: "/api/metrics/requestStatusOverTime",
      key: "requestOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            count: +d.count,
            time: new Date(d.time),
            status: d.status,
          }))
        );
      },
    }),
    costs: useBackendMetricCall<Result<CostOverTime[], string>>({
      params,
      endpoint: "/api/metrics/costOverTime",
      key: "costOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ cost: +d.cost, time: new Date(d.time) }))
        );
      },
    }),
    latency: useBackendMetricCall<Result<LatencyOverTime[], string>>({
      params,
      endpoint: "/api/metrics/latencyOverTime",
      key: "latencyOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ duration: +d.duration, time: new Date(d.time) }))
        );
      },
    }),
    users: useBackendMetricCall<Result<UsersOverTime[], string>>({
      params,
      endpoint: "/api/metrics/usersOverTime",
      key: "usersOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
  };

  const metrics = {
    totalCost: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalCost",
    }),
    totalRequests: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalRequests",
    }),
    averageLatency: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageLatency",
    }),
    averageTokensPerRequest: useBackendMetricCall<
      UnPromise<ReturnType<typeof getTokensPerRequest>>
    >({
      params,
      endpoint: "/api/metrics/averageTokensPerRequest",
    }),
    activeUsers: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/activeUsers",
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  const isAnyLoading =
    Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading);

  return {
    filterMap,
    metrics,
    overTimeData,
    isAnyLoading,
  };
};
