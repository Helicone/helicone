import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "@/packages/common/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { CacheHitsOverTime } from "../../../pages/api/cache/getCacheHitsOverTime";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useGetRequests } from "../../../services/hooks/requests";
import { TimeFilter } from "@helicone-package/filters/filterDefs";
import {
  useGetCacheCount,
  useGetCacheTotalSavings,
  useGetCacheTimeSaved,
  useGetCacheTopRequests,
} from "@/services/hooks/cache";
import { useGetRequestCount } from "@/services/hooks/requests";

export interface CachePageData {
  timeFilter: TimeFilter;
  timeZoneDifference: number;
  dbIncrement: TimeIncrement | undefined;
}

export const useCachePageClickHouse = ({
  timeFilter,
  timeZoneDifference,
  dbIncrement,
}: CachePageData) => {
  const createParams = (
    userFilters: any
  ): BackendMetricsCall<any>["params"] => ({
    timeFilter,
    userFilters,
    dbIncrement,
    timeZoneDifference,
  });

  const createCacheFilter = (operator: "equals" | "not-equals") => ({
    request_response_rmt: {
      cache_reference_id: {
        [operator]: DEFAULT_UUID,
      },
    },
  });

  const params = createParams("all");
  const countNonCachedParams = createParams(createCacheFilter("equals"));
  const countCachedParams = createParams(createCacheFilter("not-equals"));

  const overTimeData = {
    cacheHits: useBackendMetricCall<Result<CacheHitsOverTime[], string>>({
      params,
      endpoint: "/api/cache/cacheHitsOverTime",
      key: "cacheHitsOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
  };

  const metrics = {
    totalCacheHits: useGetCacheCount(timeFilter),
    totalRequests: useGetRequestCount(
      {
        left: {
          request_response_rmt: {
            request_created_at: {
              gte: timeFilter.start,
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            request_created_at: {
              lte: timeFilter.end,
            },
          },
        },
      },
      false,
      true
    ),
    totalSavings: useGetCacheTotalSavings(timeFilter),
    timeSaved: useGetCacheTimeSaved(timeFilter),
    topRequests: useGetCacheTopRequests(timeFilter),
    avgLatency: useBackendMetricCall<Result<number, string>>({
      key: "avgLatency",
      params: countNonCachedParams,
      endpoint: "/api/metrics/averageLatency",
    }),
    avgLatencyCached: useBackendMetricCall<Result<number, string>>({
      key: "avgLatencyCached",
      params: countCachedParams,
      endpoint: "/api/metrics/averageLatency",
    }),
  };

  const topRequestIds =
    metrics.topRequests.data?.data?.map((request: any) => {
      return request.request_id;
    }) ?? [];

  const topRequestsFilter: FilterNode | null =
    topRequestIds && topRequestIds.length > 0
      ? topRequestIds.reduce(
          (acc: FilterNode | null, requestId: string, index: number) => {
            const currentCondition: FilterNode = {
              request_response_rmt: {
                request_id: {
                  equals: requestId,
                },
              },
            };

            if (index === 0) return currentCondition;

            return {
              left: acc!,
              operator: "or",
              right: currentCondition,
            };
          },
          null
        )
      : null;

  const defaultFilter: FilterNode = "all";

  const topSourceRequestsWithBodies = useGetRequests(
    1,
    10,
    topRequestsFilter || defaultFilter,
    {
      created_at: "desc",
    }
  );

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  function isRequestsLoading(x: ReturnType<typeof useGetRequests>) {
    return (
      x.requests.isLoading ||
      x.requests.isRefetching ||
      x.count.isLoading ||
      x.count.isFetching
    );
  }

  const loadingStates = {
    cacheHits: isLoading(overTimeData.cacheHits),
    totalCacheHits: isLoading(metrics.totalCacheHits),
    totalRequests: isLoading(metrics.totalRequests),
    totalSavings: isLoading(metrics.totalSavings),
    timeSaved: isLoading(metrics.timeSaved),
    topRequests: isLoading(metrics.topRequests),
    avgLatency: isLoading(metrics.avgLatency),
    avgLatencyCached: isLoading(metrics.avgLatencyCached),
    topSourceRequests: isRequestsLoading(topSourceRequestsWithBodies),
  };

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const hasCacheData = (() => {
    if (loadingStates.totalCacheHits) return null;
    
    const cacheHits = metrics.totalCacheHits.data?.data;
    if (cacheHits === undefined || cacheHits === null) {
      return false;
    }
    return +cacheHits > 0;
  })();

  return {
    overTimeData,
    metrics: { ...metrics, topSourceRequestsWithBodies },
    isAnyLoading,
    loadingStates,
    hasCacheData,
  };
};
