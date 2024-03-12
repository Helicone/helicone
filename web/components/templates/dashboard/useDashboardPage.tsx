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
import { TokensOverTime } from "../../../pages/api/metrics/tokensOverTime";
import { TimeToFirstToken } from "../../../pages/api/metrics/timeToFirstToken";
import { ThreatsOverTime } from "../../../pages/api/metrics/threatsOverTime";

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
            request_response_log: {
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
    promptTokensOverTime: useBackendMetricCall<
      Result<TokensOverTime[], string>
    >({
      params,
      endpoint: "/api/metrics/tokensOverTime",
      key: "errorOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            prompt_tokens: +d.prompt_tokens,
            completion_tokens: +d.completion_tokens,
            time: new Date(d.time),
          }))
        );
      },
    }),
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
      key: "requestStatusOverTime",
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
    timeToFirstToken: useBackendMetricCall<Result<TimeToFirstToken[], string>>({
      params,
      endpoint: "/api/metrics/timeToFirstToken",
      key: "timeToFirstToken",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ ttft: +d.ttft, time: new Date(d.time) }))
        );
      },
    }),
    threats: useBackendMetricCall<Result<ThreatsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/threatsOverTime",
      key: "threatsOverTime",
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
    averageTimeToFirstToken: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageTimeToFirstToken",
    }),
    totalThreats: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalThreats",
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
    refetch: () => {
      Object.values(overTimeData).forEach((x) => x.refetch());
      Object.values(metrics).forEach((x) => x.refetch());
    },
    remove: () => {
      Object.values(overTimeData).forEach((x) => x.remove());
      Object.values(metrics).forEach((x) => x.remove());
    },
  };
};
