import { useQuery } from "@tanstack/react-query";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafRequest, SortLeafSession } from "../lib/sorts/requests/sorts";
import { Result } from "../../lib/result";

const useSessions = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: SortLeafSession,
  advancedFilters?: FilterNode
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "sessions",
      currentPage,
      currentPageSize,
      advancedFilters,
      sortLeaf,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];

      // Fetch sessions
      const [response] = await Promise.all([
        fetch("api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
            offset: (currentPage - 1) * currentPageSize,
            limit: currentPageSize,
            sort: sortLeaf,
            timeZoneDifference: new Date().getTimezoneOffset(),
          }),
        }).then((res) => res.json() as Promise<Result<Session[], string>>),
      ]);

      return {
        response,
      };
    },
    refetchOnWindowFocus: false,
  });

  const { response } = data || {
    response: undefined,
  };

  const sessions = response?.data || [];

  return {
    sessions,
    refetch,
    isLoading,
    isRefetching,
  };
};

export { useSessions };
