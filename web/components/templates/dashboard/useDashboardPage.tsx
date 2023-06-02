import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, resultMap } from "../../../lib/result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { getTimeInterval } from "../../../lib/timeCalculations/time";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";
import { useGetProperties } from "../../../services/hooks/properties";

import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
  parseKey,
} from "../../../services/lib/filters/filterDefs";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { TimeFilter } from "../../../lib/api/handlerWrappers";
import { UnPromise } from "../../../lib/tsxHelpers";
import { getErrorCodes } from "../../../lib/api/metrics/errorCodes";

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

interface BackendMetricsCall<T> {
  params: {
    timeFilter: TimeFilter;
    userFilters: FilterLeaf[];
    dbIncrement?: TimeIncrement;
    timeZoneDifference: number;
  };
  endpoint: string;
  key?: string;
  postProcess?: (data: T) => T;
}

export type MetricsBackendBody = {
  timeFilter: {
    start: string;
    end: string;
  };
  filter: FilterNode;
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
};

export function useBackendMetricCall<T>({
  params,
  endpoint,
  key,
  postProcess,
}: BackendMetricsCall<T>) {
  return useQuery<T>({
    queryKey: [endpoint, params, "" + key],
    retry: false,
    queryFn: async (query) => {
      const { timeFilter, userFilters, dbIncrement, timeZoneDifference } = query
        .queryKey[1] as BackendMetricsCall<T>["params"];
      const res = fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: filterListToTree(userFilters, "and"),
          // You cannot properly serialize Date on the wire. so we need to do this gross stuff
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
          dbIncrement,
          timeZoneDifference,
        } as MetricsBackendBody),
      }).then((res) => res.json() as Promise<T>);
      if (postProcess === undefined) {
        return await res;
      }
      return postProcess(await res);
    },
    refetchOnWindowFocus: false,
  });
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
            response_copy_v2: {
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
  };

  const errorMetrics = {
    errorCodes: useBackendMetricCall<
      UnPromise<ReturnType<typeof getErrorCodes>>
    >({
      params,
      endpoint: "/api/metrics/errorCodes",
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }
  const isAnyLoading =
    Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading) ||
    Object.values(errorMetrics).some(isLoading);

  return {
    filterMap,
    metrics,
    overTimeData,
    errorMetrics,
    isAnyLoading,
  };
};
