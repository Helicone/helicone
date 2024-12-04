import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";
import { UIFilterRowTree } from "../lib/filters/uiFilterRowTree";

const useSessions = (
  timeFilter: {
    start: Date;
    end: Date;
  },
  sessionIdSearch: string,
  advancedFilters: UIFilterRowTree,
  nameEquals?: string
) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions",
      org?.currentOrg?.id,
      timeFilter,
      sessionIdSearch,
      nameEquals,
      advancedFilters,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const timeFilter = query.queryKey[2] as {
        start: Date;
        end: Date;
      };

      const sessionIdSearch = query.queryKey[3] as string;
      const nameEquals = query.queryKey[4] as string;

      const jawnClient = getJawnClient(orgId);

      return await jawnClient.POST("/v1/session/query", {
        body: {
          search: sessionIdSearch,
          timeFilter: {
            endTimeUnixMs: timeFilter.end.getTime(),
            startTimeUnixMs: timeFilter.start.getTime(),
          },
          nameEquals: nameEquals,
          timezoneDifference: 0,
          filter: advancedFilters as any,
        },
      });
    },
    refetchOnWindowFocus: false,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    sessions: data?.data?.data || [],
    refetch,
    isLoading,
    isRefetching,
  };
};

const useSessionNames = (sessionNameSearch: string) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sessions", org?.currentOrg?.id, sessionNameSearch],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const sessionNameSearch = query.queryKey[2] as string;
      const timezoneDifference = new Date().getTimezoneOffset();

      const jawnClient = getJawnClient(orgId);
      return await jawnClient.POST("/v1/session/name/query", {
        body: {
          nameContains: sessionNameSearch,
          timezoneDifference,
        },
      });
    },
    refetchOnWindowFocus: false,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    sessions: data?.data?.data || [],
    refetch,
    isLoading,
    isRefetching,
  };
};

const useSessionMetrics = (
  sessionNameSearch: string,
  pSize: "p50" | "p75" | "p95" | "p99" | "p99.9",
  useInterquartile: boolean
) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "session-metrics",
      org?.currentOrg?.id,
      sessionNameSearch,
      pSize,
      useInterquartile,
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
      const timezoneDifference = new Date().getTimezoneOffset();

      const jawnClient = getJawnClient(orgId);
      return await jawnClient.POST("/v1/session/metrics/query", {
        body: {
          nameContains: sessionNameSearch,
          timezoneDifference,
          pSize,
          useInterquartile,
        },
      });
    },
    refetchOnWindowFocus: false,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  return {
    metrics: data?.data?.data || {
      session_count: [],
      session_duration: [],
      session_cost: [],
    },
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
  useSessions,
  useSessionNames,
  useSessionMetrics,
  updateSessionFeedback,
};
