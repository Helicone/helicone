import { useQuery } from "@tanstack/react-query";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafSession } from "../lib/sorts/requests/sorts";
import { ok } from "../../lib/result";
import { getJawnClient } from "../../lib/clients/jawn";
import { useOrg } from "../../components/layout/organizationContext";

const useSessions = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: SortLeafSession,
  advancedFilters?: FilterNode
) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions",
      currentPage,
      currentPageSize,
      advancedFilters,
      sortLeaf,
      org?.currentOrg?.id,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];
      const orgId = query.queryKey[5] as string;

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST("/v1/session/query", {
        body: {
          filter: advancedFilter as any,
          offset: (currentPage - 1) * currentPageSize,
          limit: currentPageSize,
          sort: sortLeaf as any,
        },
      });

      const result = response.data as any;
      console.log(`Result: ${JSON.stringify(result)}`);

      return ok(result);
    },
    refetchOnWindowFocus: false,
    retry: false,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  const response = data?.data || undefined;
  const sessions = response?.data || [];

  return {
    sessions,
    refetch,
    isLoading,
    isRefetching,
  };
};

export { useSessions };
