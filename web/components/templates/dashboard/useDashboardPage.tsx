import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { OverTimeRequestQueryParams } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result } from "../../../lib/result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { getTimeInterval } from "../../../lib/timeCalculations/time";
import { CostOverTime } from "../../../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../../../pages/api/metrics/errorOverTime";
import { useGetProperties } from "../../../services/hooks/properties";

import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
  parseKey,
} from "../../../services/lib/filters/filterDefs";
import {
  getPropertyFilters,
  requestTableFilters,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { useMemo } from "react";

async function fetchDataOverTime<T>(
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
interface DashboardPageData {
  timeFilter: {
    start: Date;
    end: Date;
  };
  uiFilters: UIFilterRow[];
  apiKeyFilter: string | null;
}

export const useDashboardPage = ({
  timeFilter,
  uiFilters,
  apiKeyFilter,
}: DashboardPageData) => {
  const { propertyFilters, searchPropertyFilters } = useGetProperties();
  const filterMap = (requestTableFilters as SingleFilterDef<any>[]).concat(
    propertyFilters
  );
  const userFilters =
    apiKeyFilter !== null
      ? filterUIToFilterLeafs(filterMap, uiFilters).concat([
          parseKey(apiKeyFilter),
        ])
      : filterUIToFilterLeafs(filterMap, uiFilters);

  const memoizedTimeFilter = timeFilter;

  const ret = {
    filterMap,
    metrics: useQuery({
      queryKey: ["dashboardDataMetrics", memoizedTimeFilter, userFilters],
      queryFn: async (query) => {
        const timeFilter = query.queryKey[1] as {
          start: Date;
          end: Date;
        };
        const userFilters = query.queryKey[2] as FilterLeaf[];
        const filter: FilterNode = {
          right: {
            left: {
              request: {
                created_at: {
                  gte: timeFilter.start.toISOString(),
                },
              },
            },
            operator: "and",
            right: {
              request: {
                created_at: {
                  lte: timeFilter.end.toISOString(),
                },
              },
            },
          },
          operator: "and",
          left: filterListToTree(userFilters, "and"),
        };
        return fetch("/api/metrics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filter),
        })
          .then((res) => res.json() as Promise<Result<Metrics, string>>)
          .then(({ data, error }) => {
            if (error !== null) {
              console.error(error);
              return { data, error };
            } else {
              return {
                data: {
                  ...data,
                  last_request: new Date(data.last_request),
                  first_request: new Date(data.first_request),
                },
                error,
              };
            }
          });
      },
      refetchOnWindowFocus: false,
    }),
    errorsOverTime: useQuery({
      queryKey: [
        "dashboardDataErrorsOverTime",
        memoizedTimeFilter,
        userFilters,
      ],
      queryFn: async (query) => {
        const timeFilter = query.queryKey[1] as {
          start: Date;
          end: Date;
        };
        const userFilters = query.queryKey[2] as FilterLeaf[];
        const timeInterval = getTimeInterval(timeFilter);

        return fetchDataOverTime<ErrorOverTime>(
          timeFilter,
          userFilters,
          timeInterval,
          "errorOverTime"
        ).then(({ data, error }) => {
          if (error !== null) {
            console.error(error);
            return { data, error };
          } else {
            return {
              data: data.map((d) => ({
                count: +d.count,
                time: new Date(d.time),
              })),
              error,
            };
          }
        });
      },
      refetchOnWindowFocus: false,
    }),
    requestsOverTime: useQuery({
      queryKey: [
        "dashboardDataRequestsOverTime",
        memoizedTimeFilter,
        userFilters,
      ],
      queryFn: async (query) => {
        const timeFilter = query.queryKey[1] as {
          start: Date;
          end: Date;
        };
        const userFilters = query.queryKey[2] as FilterLeaf[];
        const timeInterval = getTimeInterval(timeFilter);

        return fetchDataOverTime<RequestsOverTime>(
          timeFilter,
          userFilters,
          timeInterval,
          "requestOverTime"
        ).then(({ data, error }) => {
          if (error !== null) {
            console.error(error);
            return { data, error };
          } else {
            return {
              data: data.map((d) => ({
                count: +d.count,
                time: new Date(d.time),
              })),
              error,
            };
          }
        });
      },
      refetchOnWindowFocus: false,
    }),
    costOverTime: useQuery({
      queryKey: ["dashboardDataCostsOverTime", memoizedTimeFilter, userFilters],
      queryFn: async (query) => {
        const timeFilter = query.queryKey[1] as {
          start: Date;
          end: Date;
        };
        const userFilters = query.queryKey[2] as FilterLeaf[];
        const timeInterval = getTimeInterval(timeFilter);

        return fetchDataOverTime<CostOverTime>(
          timeFilter,
          userFilters,
          timeInterval,
          "costOverTime"
        ).then(({ data, error }) => {
          if (error !== null) {
            console.error(error);
            return { data, error };
          } else {
            return {
              data: data.map((d) => ({
                cost: +d.cost,
                time: new Date(d.time),
              })),
              error,
            };
          }
        });
      },
      refetchOnWindowFocus: false,
    }),
  };
  const isLoading =
    ret.metrics.isLoading ||
    ret.errorsOverTime.isLoading ||
    ret.requestsOverTime.isLoading ||
    ret.costOverTime.isLoading;

  return {
    ...ret,
    isLoading,
    searchPropertyFilters,
  };
};
