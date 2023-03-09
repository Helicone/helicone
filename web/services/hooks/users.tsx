import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Column } from "../../components/ThemedTableV2";

import { UserMetric } from "../../lib/api/users/users";
import { Result } from "../../lib/result";
import { FilterNode } from "../lib/filters/filterDefs";
import { getUsers } from "../lib/users";

const useUsers = (
  currentPage: number,
  currentPageSize: number,
  advancedFilter?: FilterNode
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", currentPage, currentPageSize, advancedFilter],
    queryFn: async (query) => {
      const currentPage = query.queryKey[1] as number;
      const currentPageSize = query.queryKey[2] as number;
      const advancedFilter = query.queryKey[3];
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

      return [response, count] as [
        Result<UserMetric[], string>,
        Result<number, string>
      ];
    },
    refetchOnWindowFocus: false,
  });

  const [response, count] = data || [null, null];

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
