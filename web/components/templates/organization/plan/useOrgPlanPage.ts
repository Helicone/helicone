import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "../../../../lib/result";
import { TimeIncrement } from "../../../../lib/timeCalculations/fetchTimeData";
import { RateLimitOverTime } from "../../../../pages/api/metrics/rateLimitsOverTime";
import { useBackendMetricCall } from "../../../../services/hooks/useBackendFunction";

export interface RateLimitPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  timeZoneDifference: number;
  dbIncrement: TimeIncrement | undefined;
}

const useOrgPlanPage = ({
  timeFilter,
  timeZoneDifference,
  dbIncrement,
}: RateLimitPageData) => {
  const params = {
    timeFilter: timeFilter,
    userFilters: [],
    timeZoneDifference: timeZoneDifference,
    dbIncrement,
  };

  const overTimeData = {
    rateLimits: useBackendMetricCall<Result<RateLimitOverTime[], string>>({
      params,
      endpoint: "/api/metrics/rateLimitsOverTime",
      key: "rateLimitsOverTime",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({ count: +d.count, time: new Date(d.time) }))
        );
      },
    }),
  };

  const metrics = {
    totalRateLimits: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/metrics/totalRateLimits",
      key: "totalRateLimits",
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }

  const isAnyLoading = false;
  Object.values(overTimeData).some(isLoading) ||
    Object.values(metrics).some(isLoading);

  return {
    overTimeData: overTimeData,
    metrics: metrics,
    isLoading: isAnyLoading,
    refetch: () => {
      Object.values(overTimeData).forEach((x) => x.refetch());
      Object.values(metrics).forEach((x) => x.refetch());
    },
  };
};

export { useOrgPlanPage };
