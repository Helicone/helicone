import { UseQueryResult } from "@tanstack/react-query";
import { Result } from "../../../lib/result";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import { DashboardPageData } from "../dashboard/useDashboardPage";

export const useCachePage = ({
  timeFilter,
  timeZoneDifference,
  dbIncrement,
}: DashboardPageData) => {
  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: [],
    dbIncrement,
    timeZoneDifference,
  };

  // const overTimeData = {
  //   cacheHits: useBackendMetricCall<Result<CacheHitsOverTime[], string>>({
  //     params,
  //     endpoint: "/api/cache/cacheHitsOverTime",
  //     key: "cacheHitsOverTime",
  //     postProcess: (data) => {
  //       return resultMap(data, (d) =>
  //         d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
  //       );
  //     },
  //   }),
  // };

  const metrics = {
    totalCacheHits: useBackendMetricCall<Result<number, string>>({
      key: "totalCacheHits",
      params,
      endpoint: "/api/cache/total",
    }),
  };

  console.log("metrics", JSON.stringify(metrics, null, 2));

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  const isAnyLoading =
    // Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading);

  return {
    // overTimeData,
    metrics,
    isAnyLoading,
  };
};
