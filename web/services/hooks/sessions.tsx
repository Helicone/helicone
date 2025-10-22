import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { FilterExpression } from "@helicone-package/filters/types";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import { TimeFilter } from "@/types/timeFilter";

const useSessions = ({
  timeFilter,
  sessionIdSearch,
  selectedName,
  page = 1,
  pageSize = 50,
}: {
  timeFilter: TimeFilter;
  sessionIdSearch: string;
  selectedName?: string;
  page?: number;
  pageSize?: number;
}) => {
  const org = useOrg();
  const filterStore = useFilterAST();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions",
      org?.currentOrg?.id,
      timeFilter,
      sessionIdSearch,
      selectedName,
      filterStore.store.filter,
      page,
      pageSize,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const timeFilter = query.queryKey[2] as TimeFilter;

      const sessionIdSearch = query.queryKey[3] as string;
      const nameEquals = query.queryKey[4] as string;

      const filter = query.queryKey[5] as FilterExpression;
      const jawnClient = getJawnClient(orgId);

      const result = await jawnClient.POST("/v1/session/query", {
        body: {
          search: sessionIdSearch ?? "",
          timeFilter: {
            endTimeUnixMs: timeFilter.end.getTime(),
            startTimeUnixMs: timeFilter.start.getTime(),
          },
          nameEquals: nameEquals ?? "",
          timezoneDifference: 0,
          filter: filter ? (toFilterNode(filter) as any) : ({} as FilterLeaf),
          offset: (page - 1) * pageSize,
          limit: pageSize,
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });
  const properties = useQuery({
    queryKey: ["/v1/property/query", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const res = await jawn.POST("/v1/property/query", {
        body: {},
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  return {
    sessions: data?.data?.data || [],
    refetch,
    isLoading: isLoading || properties.isLoading,
    isRefetching,
    hasSessions: !!properties.data?.data?.find((p) =>
      p.property.toLowerCase().includes("helicone-session"),
    ),
  };
};

const useSessionsAggregateMetrics = ({
  timeFilter,
  sessionIdSearch,
  selectedName,
}: {
  timeFilter: TimeFilter;
  sessionIdSearch: string;
  selectedName?: string;
}) => {
  const org = useOrg();
  const filterStore = useFilterAST();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions-count",
      org?.currentOrg?.id,
      timeFilter,
      sessionIdSearch,
      selectedName,
      filterStore.store.filter,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const timeFilter = query.queryKey[2] as TimeFilter;

      const sessionIdSearch = query.queryKey[3] as string;
      const nameEquals = query.queryKey[4] as string;

      const filter = query.queryKey[5] as FilterExpression;
      const jawnClient = getJawnClient(orgId);

      const result = await jawnClient.POST("/v1/session/count", {
        body: {
          search: sessionIdSearch ?? "",
          timeFilter: {
            endTimeUnixMs: timeFilter.end.getTime(),
            startTimeUnixMs: timeFilter.start.getTime(),
          },
          nameEquals: nameEquals ?? "",
          timezoneDifference: 0,
          filter: filter ? (toFilterNode(filter) as any) : ({} as FilterLeaf),
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    aggregateMetrics: data?.data?.data,
    refetch,
    isLoading,
    isRefetching,
  };
};

const useSessionNames = (
  sessionNameSearch: string,
  timeFilter?: TimeFilter,
) => {
  const org = useOrg();
  const filterStore = useFilterAST();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions",
      org?.currentOrg?.id,
      sessionNameSearch,
      timeFilter,
      filterStore.store.filter,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const sessionNameSearch = query.queryKey[2] as string;
      const timeFilter = query.queryKey[3] as TimeFilter | undefined;
      const filter = query.queryKey[4] as FilterExpression;
      const timezoneDifference = new Date().getTimezoneOffset();

      const jawnClient = getJawnClient(orgId);
      const result = await jawnClient.POST("/v1/session/name/query", {
        body: {
          nameContains: sessionNameSearch,
          timezoneDifference,
          timeFilter: timeFilter
            ? {
                endTimeUnixMs: timeFilter.end.getTime(),
                startTimeUnixMs: timeFilter.start.getTime(),
              }
            : undefined,
          filter: filter ? (toFilterNode(filter) as any) : ({} as FilterLeaf),
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    sessions: data?.data?.data || [],
    totalCount: data?.data?.data?.length || 0,
    refetch,
    isLoading,
    isRefetching,
  };
};

const useSessionMetrics = (
  sessionNameSearch: string,
  pSize: "p50" | "p75" | "p95" | "p99" | "p99.9",
  useInterquartile: boolean,
  timeFilter: TimeFilter,
) => {
  const org = useOrg();
  const filterStore = useFilterAST();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "session-metrics",
      org?.currentOrg?.id,
      sessionNameSearch,
      pSize,
      useInterquartile,
      timeFilter,
      filterStore.store.filter,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const sessionNameSearch = query.queryKey[2] as string;
      const pSize = query.queryKey[3] as
        | "p50"
        | "p75"
        | "p95"
        | "p99"
        | "p99.9";
      const useInterquartile = query.queryKey[4] as boolean;
      const timeFilter = query.queryKey[5] as TimeFilter;
      const filter = query.queryKey[6] as FilterExpression;
      const timezoneDifference = new Date().getTimezoneOffset();

      const jawnClient = getJawnClient(orgId);
      const result = await jawnClient.POST("/v1/session/metrics/query", {
        body: {
          nameContains: sessionNameSearch,
          timezoneDifference,
          pSize,
          useInterquartile,
          timeFilter: {
            endTimeUnixMs: timeFilter.end.getTime(),
            startTimeUnixMs: timeFilter.start.getTime(),
          },
          filter: filter ? (toFilterNode(filter) as any) : ({} as FilterLeaf),
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    metrics: data?.data?.data,
    refetch,
    isLoading,
    isRefetching,
  };
};

const updateSessionFeedback = async (sessionId: string, rating: boolean) => {
  const jawn = getJawnClient();
  return (
    await jawn.POST("/v1/session/{sessionId}/feedback", {
      params: {
        path: { sessionId },
      },
      body: {
        rating,
      },
    })
  ).response;
};

export {
  updateSessionFeedback,
  useSessionMetrics,
  useSessionNames,
  useSessions,
  useSessionsAggregateMetrics,
};
