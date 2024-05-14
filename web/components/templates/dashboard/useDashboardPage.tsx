import { UseQueryResult } from "@tanstack/react-query";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, ok, resultMap } from "../../../lib/result";
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
  textWithSuggestions,
} from "../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { LatencyOverTime } from "../../../pages/api/metrics/latencyOverTime";
import { UsersOverTime } from "../../../pages/api/metrics/usersOverTime";
import { TokensOverTime } from "../../../pages/api/metrics/tokensOverTime";
import { TimeToFirstToken } from "../../../pages/api/metrics/timeToFirstToken";
import { ThreatsOverTime } from "../../../pages/api/metrics/threatsOverTime";
import { useModels } from "../../../services/hooks/models";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";

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
  timeZoneDifference,
  dbIncrement,
}: DashboardPageData) => {
  const {
    properties,
    isLoading: isPropertiesLoading,
    propertyFilters,
    searchPropertyFilters,
  } = useGetPropertiesV2();

  const filterMap = (
    DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[]
  ).concat(propertyFilters);

  const { isLoading: isModelsLoading, models } = useModels(timeFilter, 1000);
  const topModels =
    models?.data
      ?.sort((a, b) => (a.total_requests > b.total_requests ? -1 : 1))
      .slice(0, 5) ?? [];

  // replace the model filter inside of the filterMap with the text suggestion model
  const modelFilterIdx = filterMap.findIndex(
    (filter) => filter.label === "Model"
  );
  if (modelFilterIdx !== -1) {
    filterMap[modelFilterIdx] = {
      label: "Model",
      operators: textWithSuggestions(
        topModels
          ?.filter((model) => model.model)
          .map((model) => ({
            key: model.model,
            param: model.model,
          })) || []
      ),
      category: "request",
      table: "request_response_versioned",
      column: "model",
    };
  }

  const userFilters = filterUIToFilterLeafs(filterMap, uiFilters);

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
    return x.isLoading || x.isFetching || isPropertiesLoading;
  }

  const isAnyLoading =
    Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading) ||
    isPropertiesLoading;

  return {
    filterMap,
    metrics,
    overTimeData,
    isAnyLoading,
    properties,
    searchPropertyFilters,
    refetch: () => {
      Object.values(overTimeData).forEach((x) => x.refetch());
      Object.values(metrics).forEach((x) => x.refetch());
    },
    remove: () => {
      Object.values(overTimeData).forEach((x) => x.remove());
      Object.values(metrics).forEach((x) => x.remove());
    },
    models: ok(topModels),
    isModelsLoading,
  };
};
