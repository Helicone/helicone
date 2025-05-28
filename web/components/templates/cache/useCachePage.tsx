import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "@/packages/common/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { CacheHitsOverTime } from "../../../pages/api/cache/getCacheHitsOverTime";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { useGetRequests } from "../../../services/hooks/requests";

export interface CachePageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
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
    totalCacheHits: useBackendMetricCall<Result<number, string>>({
      key: "totalCacheHits",
      params,
      endpoint: "/api/cache/total",
    }),
    totalRequests: useBackendMetricCall<Result<number, string>>({
      key: "totalRequests",
      params,
      endpoint: "/api/request/count",
    }),
    totalSavings: useBackendMetricCall<Result<number, string>>({
      key: "totalSavings",
      params,
      endpoint: "/api/cache/total_savings",
    }),
    timeSaved: useBackendMetricCall<Result<number, string>>({
      key: "timeSaved",
      params,
      endpoint: "/api/cache/time_saved",
    }),
    topRequests: useBackendMetricCall<Result<any, string>>({
      key: "topRequests",
      params,
      endpoint: "/api/cache/requests",
    }),
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

  const topRequestIds = metrics.topRequests.data?.data.map((request: any) => {
    return request.request_id;
  });

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

  const isAnyLoading =
    Object.values(overTimeData).some((x) => isLoading(x)) ||
    Object.values(metrics).some((x) => isLoading(x)) ||
    isRequestsLoading(topSourceRequestsWithBodies);

  return {
    overTimeData,
    metrics: { ...metrics, topSourceRequestsWithBodies },
    isAnyLoading,
  };
};
