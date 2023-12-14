import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "../../lib/api/handlerWrappers";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import {
  FilterLeaf,
  FilterNode,
  filterListToTree,
} from "../lib/filters/filterDefs";

/**
 * Represents a backend metrics call.
 * @template T - The type of data returned by the backend call.
 */
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

/**
 * Represents the body of a metrics backend request.
 */
export type MetricsBackendBody = {
  timeFilter: {
    start: string;
    end: string;
  };
  filter: FilterNode;
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
};

/**
 * Custom hook for making backend metric calls.
 * @template T - The type of the response data.
 * @param {BackendMetricsCall<T>} options - The options for the backend metric call.
 * @returns {QueryResult<T>} - The query result object.
 */
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
