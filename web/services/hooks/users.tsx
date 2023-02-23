import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../lib/users";

const useUsers = (currentPage: number, currentPageSize: number) => {
  const supabase = useSupabaseClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", currentPage, currentPageSize],
    queryFn: async (query) => {
      return getUsers(
        supabase,
        query.queryKey[1] as number,
        query.queryKey[2] as number
      ).then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  //   const { data, error, count, from, to } = await getUsers(
  //     supabase,
  //     currentPage,
  //     pageSize
  //   );
};

export { useUsers };
