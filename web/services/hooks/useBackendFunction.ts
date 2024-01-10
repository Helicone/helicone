import { useQuery } from "@tanstack/react-query";

import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import {
  FilterLeaf,
  FilterNode,
  filterListToTree,
} from "../../lib/shared/filters/filterDefs";
import { TimeFilter } from "../../lib/shared/filters/timeFilter";

export interface BackendMetricsCall<T> {
  params: {
    timeFilter: TimeFilter;
    userFilters: FilterLeaf[];
    dbIncrement?: TimeIncrement;
    timeZoneDifference: number;
  };
  endpoint: string;
  key?: string;
  postProcess?: (data: T) => T;
}

export type MetricsBackendBody = {
  timeFilter: {
    start: string;
    end: string;
  };
  filter: FilterNode;
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
};

export function useBackendMetricCall<T>({
  params,
  endpoint,
  key,
  postProcess,
}: BackendMetricsCall<T>) {
  return useQuery<T>({
    queryKey: [endpoint, params, "" + key],
    retry: false,
    queryFn: async (query) => {
      const { timeFilter, userFilters, dbIncrement, timeZoneDifference } = query
        .queryKey[1] as BackendMetricsCall<T>["params"];
      const res = fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: filterListToTree(userFilters, "and"),
          // You cannot properly serialize Date on the wire. so we need to do this gross stuff
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
          dbIncrement,
          timeZoneDifference,
        } as MetricsBackendBody),
      }).then((res) => res.json() as Promise<T>);
      if (postProcess === undefined) {
        return await res;
      }
      return postProcess(await res);
    },
    refetchOnWindowFocus: false,
  });
}
