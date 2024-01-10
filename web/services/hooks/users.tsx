import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";

import { UserMetric } from "../../lib/api/users/users";
import { Result } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafUsers } from "../../lib/shared/sorts/users/sorts";
import { DailyActiveUsers } from "../../pages/api/request_users/dau";

const useUsers = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: SortLeafUsers,
  advancedFilter?: FilterNode
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", currentPage, currentPageSize, advancedFilter, sortLeaf],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
      const sortLeaf = query.queryKey[4];
      const [response, count] = await Promise.all([
        fetch("/api/request_users", {
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
        }).then((res) => res.json() as Promise<Result<UserMetric[], string>>),
        fetch("/api/request_users/count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: advancedFilter,
          }),
        }).then((res) => res.json() as Promise<Result<number, string>>),
      ]);

      return {
        response,
        count,
      };
    },
    refetchOnWindowFocus: false,
  });

  const { response, count } = data || {
    response: undefined,
    count: undefined,
    dailyActiveUsers: undefined,
  };

  const users = response?.data || [];
  const from = (currentPage - 1) * currentPageSize;
  const to = currentPage * currentPageSize;
  const error = response?.error;

  return {
    users,
    count: count?.data ?? 0,
    from,
    to,
    error,
    isLoading,
    refetch,
    isRefetching,
  };
};

export { useUsers };
