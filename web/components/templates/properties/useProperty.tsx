import { UseQueryResult } from "@tanstack/react-query";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, resultMap } from "../../../lib/result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";

import { getTokensPerRequest } from "../../../lib/api/metrics/averageTokensPerRequest";
import { getErrorCodes } from "../../../lib/api/metrics/errorCodes";
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
} from "../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";

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

export interface PropertyPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  property: string;
}

export const usePropertyCard = (props: PropertyPageData) => {
  const { timeFilter, property } = props;
  const params: BackendMetricsCall<any>["params"] = {
    timeFilter,
    userFilters: [
      {
        property_with_response_v1: {
          property_key: {
            equals: property,
          },
        },
      },
    ],
    dbIncrement: "day",
    timeZoneDifference: 0,
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
    aggregatedKeyMetrics: useBackendMetricCall<Result<number, string>>({
      params,
      endpoint: "/api/properties/aggregatedKeyMetrics",
    }),
  };

  function isLoading(x: UseQueryResult<any>) {
    return x.isLoading || x.isFetching;
  }
  const isAnyLoading =
    Object.values(keyMetrics).some(isLoading) ||
    Object.values(valueMetrics).some(isLoading);

  return {
    keyMetrics,
    valueMetrics,
    isAnyLoading,
  };
};
