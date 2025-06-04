import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@helicone-package/filters/filterDefs";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";

export interface BackendMetricsCall<T> {
  params: {
    timeFilter: TimeFilter;
    userFilters: FilterNode;
    dbIncrement?: TimeIncrement;
    timeZoneDifference: number;
    limit?: number;
    sortKey?: string;
    sortDirection?: "asc" | "desc";
  };
  endpoint: string;
  key?: string;
  isLive?: boolean;
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
  organizationId?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
};

export function useBackendMetricCall<T>({
  params,
  endpoint,
  key,
  postProcess,
  isLive,
}: BackendMetricsCall<T>) {
  return useQuery<T>({
    queryKey: [endpoint, params, "" + key],
    retry: false,
    refetchInterval: isLive ? 5_000 : undefined,
    queryFn: async (query) => {
      const {
        timeFilter,
        userFilters,
        dbIncrement,
        timeZoneDifference,
        sortKey,
        sortDirection,
      } = query.queryKey[1] as BackendMetricsCall<T>["params"];
      const res = fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: userFilters,
          // You cannot properly serialize Date on the wire. so we need to do this gross stuff
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
          dbIncrement,
          timeZoneDifference,
          limit: params.limit,
          sortKey,
          sortDirection,
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
