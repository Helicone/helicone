import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { Result, ok, resultMap } from "@/packages/common/result";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";

import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { TokensOverTime } from "@/pages/api/metrics/TokensOverTimeType";
import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { LatencyOverTime } from "../../../lib/api/metrics/getLatencyOverTime";
import { ThreatsOverTime } from "../../../lib/api/metrics/getThreatsOverTime";
import { TimeToFirstToken } from "../../../lib/api/metrics/getTimeToFirstToken";
import { UsersOverTime } from "../../../lib/api/metrics/getUsersOverTime";
import { UnPromise } from "../../../lib/tsxHelpers";
import { useModels } from "../../../services/hooks/models";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";

export async function fetchDataOverTime<T>(
  timeFilter: {
    start: Date;
    end: Date;
  },
  userFilters: FilterLeaf[],
  dbIncrement: TimeIncrement,
  path: string,
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
  timeZoneDifference: number;
  dbIncrement: TimeIncrement;
  isLive: boolean;
}

export const useDashboardPage = ({
  timeFilter,
  timeZoneDifference,
  dbIncrement,
  isLive,
}: DashboardPageData) => {
  const properties = useGetPropertiesV2(getPropertyFiltersV2);
  const filterStore = useFilterStore();
  const filter = filterStore.filter
    ? toFilterNode(filterStore.filter)
    : ({} as FilterLeaf);

  const { isLoading: isModelsLoading, models } = useModels(
    timeFilter,
    1000,
    filter,
  );
  const topModels =
    models?.data?.sort((a, b) =>
      a.total_requests > b.total_requests ? -1 : 1,
    ) ?? [];

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: filter,
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
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            prompt_tokens: +d.prompt_tokens,
            completion_tokens: +d.completion_tokens,
            time: new Date(d.time),
          })),
        );
      },
    }),
    errors: useBackendMetricCall<Result<ErrorOverTime[], string>>({
      params,
      endpoint: "/api/metrics/errorOverTime",
      key: "errorOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) })),
        );
      },
    }),
    requests: useBackendMetricCall<Result<RequestsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/requestOverTime",
      key: "requestOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) })),
        );
      },
    }),
    requestsWithStatus: useBackendMetricCall<
      Result<(RequestsOverTime & { status: number })[], string>
    >({
      params,
      endpoint: "/api/metrics/requestStatusOverTime",
      key: "requestStatusOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            count: +d.count,
            time: new Date(d.time),
            status: d.status,
          })),
        );
      },
    }),
    costs: useBackendMetricCall<Result<CostOverTime[], string>>({
      params,
      endpoint: "/api/metrics/costOverTime",
      key: "costOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ cost: +d.cost, time: new Date(d.time) })),
        );
      },
    }),
    latency: useBackendMetricCall<Result<LatencyOverTime[], string>>({
      params,
      endpoint: "/api/metrics/latencyOverTime",
      key: "latencyOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ duration: +d.duration, time: new Date(d.time) })),
        );
      },
    }),
    users: useBackendMetricCall<Result<UsersOverTime[], string>>({
      params,
      endpoint: "/api/metrics/usersOverTime",
      key: "usersOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) })),
        );
      },
    }),
    timeToFirstToken: useBackendMetricCall<Result<TimeToFirstToken[], string>>({
      params,
      endpoint: "/api/metrics/timeToFirstToken",
      key: "timeToFirstToken",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ ttft: +d.ttft, time: new Date(d.time) })),
        );
      },
    }),
    threats: useBackendMetricCall<Result<ThreatsOverTime[], string>>({
      params,
      endpoint: "/api/metrics/threatsOverTime",
      key: "threatsOverTime",
      isLive,
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) })),
        );
      },
    }),
  };

  const metrics = {
    totalCost: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalCost/",
      isLive,
    }),
    totalRequests: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalRequests/",
      isLive,
    }),
    averageLatency: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageLatency/",
      isLive,
    }),
    averageTokensPerRequest: useBackendMetricCall<
      UnPromise<ReturnType<typeof getTokensPerRequest>>
    >({
      params,
      endpoint: "/api/metrics/averageTokensPerRequest/",
      isLive,
    }),
    activeUsers: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/activeUsers/",
      isLive,
    }),
    averageTimeToFirstToken: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/averageTimeToFirstToken/",
      isLive,
    }),
    totalThreats: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalThreats/",
      isLive,
    }),
  };

  const isAnyLoading =
    Object.values(overTimeData).some(
      ({ isLoading, isFetching }) => isLoading || isFetching,
    ) ||
    Object.values(metrics).some(
      ({ isLoading, isFetching }) => isLoading || isFetching,
    ) ||
    isModelsLoading;

  return {
    metrics,
    overTimeData,
    isAnyLoading,
    properties,
    refetch: () => {
      Object.values(overTimeData).forEach((x) => x.refetch());
      Object.values(metrics).forEach((x) => x.refetch());
    },
    models: ok(topModels),
    isModelsLoading,
  };
};
