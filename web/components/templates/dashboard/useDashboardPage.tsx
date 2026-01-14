import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { ok } from "@/packages/common/result";

import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { useModels } from "../../../services/hooks/models";
import { useProviders } from "../../../services/hooks/providers";
import { useGetPropertiesV2 } from "../../../services/hooks/propertiesV2";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import { getPropertyFiltersV2 } from "@helicone-package/filters/frontendFilterDefs";
import {
  useRequestsOverTime,
  useCostOverTime,
  useTokensOverTime,
  useLatencyOverTime,
  useTimeToFirstTokenOverTime,
  useUsersOverTime,
  useThreatsOverTime,
  useErrorsOverTime,
  useRequestStatusOverTime,
  useTotalRequests,
  useTotalCost,
  useAverageLatency,
  useAverageTokensPerRequest,
  useActiveUsers,
  useAverageTimeToFirstToken,
  useTotalThreats,
  JawnMetricsParams,
} from "../../../services/hooks/useJawnMetrics";

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
    filter
  );
  const topModels =
    models && models.error === null && Array.isArray(models.data)
      ? [...models.data].sort((a, b) =>
          a.total_requests > b.total_requests ? -1 : 1
        )
      : [];

  const { isLoading: isProvidersLoading, providers } = useProviders(
    timeFilter,
    1000,
    filter
  );

  // Extract providers data safely from the openapi-fetch response
  const providersData =
    providers &&
    "data" in providers &&
    providers.data &&
    typeof providers.data === "object" &&
    "data" in providers.data &&
    !providers.data.error
      ? providers.data.data
      : null;

  const topProviders = Array.isArray(providersData)
    ? [...providersData].sort((a, b) =>
        a.total_requests > b.total_requests ? -1 : 1
      )
    : [];

  const params: JawnMetricsParams = {
    timeFilter,
    userFilters: filter,
    dbIncrement,
    timeZoneDifference,
  };

  // Over time data using Jawn endpoints
  const tokensOverTimeQuery = useTokensOverTime(params, isLive);
  const errorsOverTimeQuery = useErrorsOverTime(params, isLive);
  const requestsOverTimeQuery = useRequestsOverTime(params, isLive);
  const requestStatusOverTimeQuery = useRequestStatusOverTime(params, isLive);
  const costsOverTimeQuery = useCostOverTime(params, isLive);
  const latencyOverTimeQuery = useLatencyOverTime(params, isLive);
  const usersOverTimeQuery = useUsersOverTime(params, isLive);
  const timeToFirstTokenOverTimeQuery = useTimeToFirstTokenOverTime(
    params,
    isLive
  );
  const threatsOverTimeQuery = useThreatsOverTime(params, isLive);

  // Aggregate metrics using Jawn endpoints
  const totalCostQuery = useTotalCost(params, isLive);
  const totalRequestsQuery = useTotalRequests(params, isLive);
  const averageLatencyQuery = useAverageLatency(params, isLive);
  const averageTokensPerRequestQuery = useAverageTokensPerRequest(
    params,
    isLive
  );
  const activeUsersQuery = useActiveUsers(params, isLive);
  const averageTimeToFirstTokenQuery = useAverageTimeToFirstToken(
    params,
    isLive
  );
  const totalThreatsQuery = useTotalThreats(params, isLive);

  // Transform Jawn responses to match the expected format
  const overTimeData = {
    promptTokensOverTime: {
      data: tokensOverTimeQuery.data?.data
        ? {
            data: tokensOverTimeQuery.data.data.map((d) => ({
              prompt_tokens: +d.prompt_tokens,
              completion_tokens: +d.completion_tokens,
              time: new Date(d.time),
            })),
            error: null,
          }
        : tokensOverTimeQuery.data?.error
          ? { data: null, error: tokensOverTimeQuery.data.error }
          : undefined,
      isLoading: tokensOverTimeQuery.isLoading,
      isFetching: tokensOverTimeQuery.isFetching,
      refetch: tokensOverTimeQuery.refetch,
    },
    errors: {
      data: errorsOverTimeQuery.data?.data
        ? {
            data: errorsOverTimeQuery.data.data.map((d) => ({
              count: +d.count,
              time: new Date(d.time),
            })),
            error: null,
          }
        : errorsOverTimeQuery.data?.error
          ? { data: null, error: errorsOverTimeQuery.data.error }
          : undefined,
      isLoading: errorsOverTimeQuery.isLoading,
      isFetching: errorsOverTimeQuery.isFetching,
      refetch: errorsOverTimeQuery.refetch,
    },
    requests: {
      data: requestsOverTimeQuery.data?.data
        ? {
            data: requestsOverTimeQuery.data.data.map((d) => ({
              count: +d.count,
              time: new Date(d.time),
            })),
            error: null,
          }
        : requestsOverTimeQuery.data?.error
          ? { data: null, error: requestsOverTimeQuery.data.error }
          : undefined,
      isLoading: requestsOverTimeQuery.isLoading,
      isFetching: requestsOverTimeQuery.isFetching,
      refetch: requestsOverTimeQuery.refetch,
    },
    requestsWithStatus: {
      data: requestStatusOverTimeQuery.data?.data
        ? {
            data: requestStatusOverTimeQuery.data.data.map((d) => ({
              count: +d.count,
              time: new Date(d.time),
              status: d.status ?? 0,
            })),
            error: null,
          }
        : requestStatusOverTimeQuery.data?.error
          ? { data: null, error: requestStatusOverTimeQuery.data.error }
          : undefined,
      isLoading: requestStatusOverTimeQuery.isLoading,
      isFetching: requestStatusOverTimeQuery.isFetching,
      refetch: requestStatusOverTimeQuery.refetch,
    },
    costs: {
      data: costsOverTimeQuery.data?.data
        ? {
            data: costsOverTimeQuery.data.data.map((d) => ({
              cost: +d.cost,
              time: new Date(d.time),
            })),
            error: null,
          }
        : costsOverTimeQuery.data?.error
          ? { data: null, error: costsOverTimeQuery.data.error }
          : undefined,
      isLoading: costsOverTimeQuery.isLoading,
      isFetching: costsOverTimeQuery.isFetching,
      refetch: costsOverTimeQuery.refetch,
    },
    latency: {
      data: latencyOverTimeQuery.data?.data
        ? {
            data: latencyOverTimeQuery.data.data.map((d) => ({
              duration: +d.duration,
              time: new Date(d.time),
            })),
            error: null,
          }
        : latencyOverTimeQuery.data?.error
          ? { data: null, error: latencyOverTimeQuery.data.error }
          : undefined,
      isLoading: latencyOverTimeQuery.isLoading,
      isFetching: latencyOverTimeQuery.isFetching,
      refetch: latencyOverTimeQuery.refetch,
    },
    users: {
      data: usersOverTimeQuery.data?.data
        ? {
            data: usersOverTimeQuery.data.data.map((d) => ({
              count: +d.count,
              time: new Date(d.time),
            })),
            error: null,
          }
        : usersOverTimeQuery.data?.error
          ? { data: null, error: usersOverTimeQuery.data.error }
          : undefined,
      isLoading: usersOverTimeQuery.isLoading,
      isFetching: usersOverTimeQuery.isFetching,
      refetch: usersOverTimeQuery.refetch,
    },
    timeToFirstToken: {
      data: timeToFirstTokenOverTimeQuery.data?.data
        ? {
            data: timeToFirstTokenOverTimeQuery.data.data.map((d) => ({
              ttft: +d.ttft,
              time: new Date(d.time),
            })),
            error: null,
          }
        : timeToFirstTokenOverTimeQuery.data?.error
          ? { data: null, error: timeToFirstTokenOverTimeQuery.data.error }
          : undefined,
      isLoading: timeToFirstTokenOverTimeQuery.isLoading,
      isFetching: timeToFirstTokenOverTimeQuery.isFetching,
      refetch: timeToFirstTokenOverTimeQuery.refetch,
    },
    threats: {
      data: threatsOverTimeQuery.data?.data
        ? {
            data: threatsOverTimeQuery.data.data.map((d) => ({
              count: +d.count,
              time: new Date(d.time),
            })),
            error: null,
          }
        : threatsOverTimeQuery.data?.error
          ? { data: null, error: threatsOverTimeQuery.data.error }
          : undefined,
      isLoading: threatsOverTimeQuery.isLoading,
      isFetching: threatsOverTimeQuery.isFetching,
      refetch: threatsOverTimeQuery.refetch,
    },
  };

  const metrics = {
    totalCost: {
      data: totalCostQuery.data,
      isLoading: totalCostQuery.isLoading,
      isFetching: totalCostQuery.isFetching,
      refetch: totalCostQuery.refetch,
    },
    totalRequests: {
      data: totalRequestsQuery.data,
      isLoading: totalRequestsQuery.isLoading,
      isFetching: totalRequestsQuery.isFetching,
      refetch: totalRequestsQuery.refetch,
    },
    averageLatency: {
      data: averageLatencyQuery.data,
      isLoading: averageLatencyQuery.isLoading,
      isFetching: averageLatencyQuery.isFetching,
      refetch: averageLatencyQuery.refetch,
    },
    averageTokensPerRequest: {
      data: averageTokensPerRequestQuery.data,
      isLoading: averageTokensPerRequestQuery.isLoading,
      isFetching: averageTokensPerRequestQuery.isFetching,
      refetch: averageTokensPerRequestQuery.refetch,
    },
    activeUsers: {
      data: activeUsersQuery.data,
      isLoading: activeUsersQuery.isLoading,
      isFetching: activeUsersQuery.isFetching,
      refetch: activeUsersQuery.refetch,
    },
    averageTimeToFirstToken: {
      data: averageTimeToFirstTokenQuery.data,
      isLoading: averageTimeToFirstTokenQuery.isLoading,
      isFetching: averageTimeToFirstTokenQuery.isFetching,
      refetch: averageTimeToFirstTokenQuery.refetch,
    },
    totalThreats: {
      data: totalThreatsQuery.data,
      isLoading: totalThreatsQuery.isLoading,
      isFetching: totalThreatsQuery.isFetching,
      refetch: totalThreatsQuery.refetch,
    },
  };

  const isAnyLoading =
    Object.values(overTimeData).some(
      ({ isLoading, isFetching }) => isLoading || isFetching
    ) ||
    Object.values(metrics).some(
      ({ isLoading, isFetching }) => isLoading || isFetching
    ) ||
    isModelsLoading ||
    isProvidersLoading;

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
    providers: ok(topProviders),
    isProvidersLoading,
  };
};
