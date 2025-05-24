import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "@/packages/common/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { CacheHitsOverTime } from "../../../pages/api/cache/getCacheHitsOverTime";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
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
  const createParams = (userFilters: any): BackendMetricsCall<any>["params"] => ({
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

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  const isAnyLoading =
    Object.values(overTimeData).some((x) => isLoading(x)) ||
    Object.values(metrics).some((x) => isLoading(x));

  return {
    overTimeData,
    metrics,
    isAnyLoading,
  };
};
