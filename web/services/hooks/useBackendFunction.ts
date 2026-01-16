import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@helicone-package/filters/filterDefs";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { $JAWN_API } from "@/lib/clients/jawn";

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

// Map old web API endpoints to Jawn endpoints
const JAWN_ENDPOINT_MAP: Record<string, string> = {
  "/api/metrics/requestOverTime": "/v1/metrics/requestOverTime",
  "/api/metrics/costOverTime": "/v1/metrics/costOverTime",
  "/api/metrics/tokensOverTime": "/v1/metrics/tokensOverTime",
  "/api/metrics/latencyOverTime": "/v1/metrics/latencyOverTime",
  "/api/metrics/timeToFirstToken": "/v1/metrics/timeToFirstToken",
  "/api/metrics/usersOverTime": "/v1/metrics/usersOverTime",
  "/api/metrics/threatsOverTime": "/v1/metrics/threatsOverTime",
  "/api/metrics/errorOverTime": "/v1/metrics/errorOverTime",
  "/api/metrics/requestStatusOverTime": "/v1/metrics/requestStatusOverTime",
  "/api/metrics/totalRequests": "/v1/metrics/totalRequests",
  "/api/metrics/totalCost": "/v1/metrics/totalCost",
  "/api/metrics/averageLatency": "/v1/metrics/averageLatency",
  "/api/metrics/averageTimeToFirstToken": "/v1/metrics/averageTimeToFirstToken",
  "/api/metrics/averageTokensPerRequest": "/v1/metrics/averageTokensPerRequest",
  "/api/metrics/totalThreats": "/v1/metrics/totalThreats",
  "/api/metrics/activeUsers": "/v1/metrics/activeUsers",
};

export function useBackendMetricCall<T>({
  params,
  endpoint,
  key,
  postProcess,
  isLive,
}: BackendMetricsCall<T>) {
  const jawnEndpoint = JAWN_ENDPOINT_MAP[endpoint];

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

      const body = {
        filter: userFilters,
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
        dbIncrement,
        timeZoneDifference,
        limit: params.limit,
        sortKey,
        sortDirection,
      } as MetricsBackendBody;

      let result: T;

      if (jawnEndpoint) {
        // Use Jawn API for migrated endpoints
        const jawnRes = await $JAWN_API.POST(jawnEndpoint as any, {
          body: body as any,
        });
        result = jawnRes.data as T;
      } else {
        // Fall back to old web API for non-migrated endpoints
        result = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }).then((res) => res.json() as Promise<T>);
      }

      if (postProcess === undefined) {
        return result;
      }
      return postProcess(result);
    },
    refetchOnWindowFocus: false,
  });
}
