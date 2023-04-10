import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { Column } from "../../components/ThemedTableV2";
import { HeliconeRequest } from "../../lib/api/request/request";
import { Result } from "../../lib/result";
import { FilterLeaf, FilterNode } from "../lib/filters/filterDefs";
import { getRequests } from "../lib/requests";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";

const useGetRequests = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter: FilterNode,
  sortLeaf: SortLeafRequest,
  options?: QueryObserverOptions
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "requests",
      currentPage,
      currentPageSize,
      advancedFilter,
      sortLeaf,
    ],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];
      return await Promise.all([
        fetch("/api/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
            offset: (currentPage - 1) * currentPageSize,
            limit: currentPageSize,
            sort: sortLeaf,
          }),
        }).then(
          (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
        ),
        fetch("/api/request/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>),
      ]);
    },
    refetchOnWindowFocus: false,
  });
  const [response, count] = data || [null, null];

  const requests = response?.data || [];
  const from = (currentPage - 1) * currentPageSize;
  const to = currentPage * currentPageSize;
  const error = response?.error;

  return {
    requests,
    count: count?.data ?? 0,
    from,
    to,
    error,
    isLoading,
    refetch,
    isRefetching,
  };
};

export { useGetRequests };
