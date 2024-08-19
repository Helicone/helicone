import { UseQueryResult } from "@tanstack/react-query";
import { Result, resultMap } from "../../../lib/result";

import { getAggregatedKeyMetrics } from "../../../lib/api/property/aggregatedKeyMetrics";
import { UnPromise } from "../../../lib/tsxHelpers";
import {
  BackendMetricsCall,
  useBackendMetricCall,
} from "../../../services/hooks/useBackendFunction";
import {
  FilterBranch,
  FilterLeaf,
} from "../../../services/lib/filters/filterDefs";

export interface PropertyPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  property: string;
  limit?: number;
}

export const usePropertyCard = (props: PropertyPageData) => {
  const { timeFilter, property, limit = 10 } = props;
  const propertyFilterLeaf: FilterLeaf = {
    request_response_rmt: {
      search_properties: {
        [property]: {
          equals: property,
        },
      },
    },
  };

  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: {
      left: propertyFilterLeaf,
      operator: "and",
      right: "all",
    } as FilterBranch,
    dbIncrement: "day",
    timeZoneDifference: 0,
    limit,
  };

  const keyMetrics = {
    totalCost: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/property/totalCost",
    }),
    totalRequests: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/property/totalRequests",
    }),
    averageLatency: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/property/averageLatency",
    }),
  };

  const valueMetrics = {
    aggregatedKeyMetrics: useBackendMetricCall<
      UnPromise<ReturnType<typeof getAggregatedKeyMetrics>>
    >({
      params,
      endpoint: "/api/property/aggregatedKeyMetrics",
      postProcess: (data) => {
        return resultMap(data, (d) =>
          d.map((d) => ({
            ...d,
            active_since: new Date(d.active_since).toLocaleDateString(),
            total_cost: +d.total_cost.toPrecision(5),
          }))
        );
      },
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }
  const isAnyLoading =
    Object.values(keyMetrics).some(isLoading) ||
    Object.values(valueMetrics).some(isLoading);

  const refetch = () => {
    Object.values(valueMetrics).forEach((x) => x.refetch());
  };

  const isRefetching = Object.values(valueMetrics).some((x) => x.isFetching);

  return {
    keyMetrics,
    valueMetrics,
    isAnyLoading,
    refetch,
    isRefetching,
  };
};
