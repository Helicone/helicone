import { useQuery } from "@tanstack/react-query";
import { TimeFilter } from "@helicone-package/filters/filterDefs";
import { TimeIncrement } from "../../lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { $JAWN_API } from "@/lib/clients/jawn";
import { Result } from "@/packages/common/result";

// Type assertion helper for FilterNode - the generated types are more restrictive
// but at runtime FilterNode is compatible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JawnFilterNode = any;

export interface JawnMetricsParams {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
  dbIncrement?: TimeIncrement;
  timeZoneDifference: number;
}

// Over time data hooks
export function useRequestsOverTime(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/requestOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useCostOverTime(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/costOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useTokensOverTime(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/tokensOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useLatencyOverTime(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/latencyOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useTimeToFirstTokenOverTime(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/timeToFirstToken",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useUsersOverTime(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/usersOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useThreatsOverTime(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/threatsOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useErrorsOverTime(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/errorOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useRequestStatusOverTime(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/requestStatusOverTime",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
        dbIncrement: params.dbIncrement ?? "hour",
        timeZoneDifference: params.timeZoneDifference,
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

// Aggregate metrics hooks
export function useTotalRequests(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/totalRequests",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useTotalCost(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/totalCost",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useAverageLatency(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/averageLatency",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useAverageTimeToFirstToken(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/averageTimeToFirstToken",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useAverageTokensPerRequest(
  params: JawnMetricsParams,
  isLive?: boolean
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/averageTokensPerRequest",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useTotalThreats(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/totalThreats",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

export function useActiveUsers(params: JawnMetricsParams, isLive?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/activeUsers",
    {
      body: {
        filter: params.userFilters as JawnFilterNode,
        timeFilter: {
          start: params.timeFilter.start.toISOString(),
          end: params.timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: isLive ? 5_000 : undefined,
    }
  );
}

// Request count (cached)
export function useRequestCount(filter: FilterNode, isCached?: boolean) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/requestCount",
    {
      body: {
        filter: filter as JawnFilterNode,
        isCached,
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}

// Model metrics
export function useModelMetrics(
  filter: FilterNode,
  timeFilter: TimeFilter,
  offset: number,
  limit: number
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/models",
    {
      body: {
        filter: filter as JawnFilterNode,
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
        offset,
        limit,
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}

// Country metrics
export function useCountryMetrics(
  filter: FilterNode,
  timeFilter: TimeFilter,
  offset: number,
  limit: number
) {
  return $JAWN_API.useQuery(
    "post",
    "/v1/metrics/country",
    {
      body: {
        filter: filter as JawnFilterNode,
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
        offset,
        limit,
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}
