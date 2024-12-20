import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";
import { FilterNode } from "../lib/filters/filterDefs";

const useUserMetrics = (
  filter: FilterNode,
  pSize: "p50" | "p75" | "p95" | "p99" | "p99.9",
  useInterquartile: boolean
) => {
  const org = useOrg();
  return useQuery({
    queryKey: [
      "userMetrics",
      org?.currentOrg?.id,
      filter,
      pSize,
      useInterquartile,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const filter = query.queryKey[2] as FilterNode;
      const pSize = query.queryKey[3] as
        | "p50"
        | "p75"
        | "p95"
        | "p99"
        | "p99.9";
      const useInterquartile = query.queryKey[4] as boolean;

      const jawnClient = getJawnClient(orgId);

      return await jawnClient.POST("/v1/user/metrics-overview/query", {
        body: {
          filter: filter as any,
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
  updateSessionFeedback,
  useSessionMetrics,
  useSessionNames,
  useUserMetrics,
};
