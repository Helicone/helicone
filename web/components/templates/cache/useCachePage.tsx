import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "../../../lib/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { CacheHitsOverTime } from "../../../pages/api/cache/getCacheHitsOverTime";

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
  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: [],
    dbIncrement,
    timeZoneDifference,
  };

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
    topModels: useBackendMetricCall<Result<any, string>>({
      key: "topModels",
      params,
      endpoint: "/api/cache/top_models",
    }),
    topRequests: useBackendMetricCall<Result<any, string>>({
      key: "topRequests",
      params,
      endpoint: "/api/cache/requests",
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  const isAnyLoading = false;
  Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading);

  return {
    overTimeData,
    metrics,
    isAnyLoading,
  };
};
