import { useQuery } from "@tanstack/react-query";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafSession } from "../lib/sorts/requests/sorts";
import { ok } from "../../lib/result";
import { getJawnClient } from "../../lib/clients/jawn";
import { useOrg } from "../../components/layout/organizationContext";

const useSessions = (
  timeFilter: {
    start: Date;
    end: Date;
  },
  sessionIdSearch: string
) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sessions", org?.currentOrg?.id, timeFilter, sessionIdSearch],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const timeFilter = query.queryKey[2] as {
        start: Date;
        end: Date;
      };

      const sessionIdSearch = query.queryKey[3] as string;

      const jawnClient = getJawnClient(orgId);
      return await jawnClient.POST("/v1/session/query", {
        body: {
          sessionIdContains: sessionIdSearch,
          timeFilter: {
            endTimeUnixMs: timeFilter.end.getTime(),
            startTimeUnixMs: timeFilter.start.getTime(),
          },
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

export { useSessions };
