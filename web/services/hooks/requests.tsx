import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";
import { getRequests, ResponseAndRequest } from "../lib/requests";

const useRequests = (
  currentTimeFilter: string | null,
  currentPage: number,
  currentPageSize: number,
  sortBy: string | null
): {
  requests: ResponseAndRequest[];
  count: number;
  from: number;
  to: number;
  error: string;
  isLoading: boolean;
  refetch: () => void;
  isRefetching: boolean;
} => {
  const supabase = useSupabaseClient<Database>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "requests",
      currentTimeFilter,
      currentPage,
      currentPageSize,
      sortBy,
    ],
    queryFn: async (query) => {
      return getRequests(
        supabase,
        query.queryKey[2] as number,
        query.queryKey[3] as number,
        query.queryKey[4] as string | null,
        query.queryKey[1] as string | null
      ).then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const requests = data?.data ?? [];
  const count = data?.count ?? 0;
  const from = data?.from ?? 0;
  const to = data?.to ?? 0;
  const error = data?.error?.message ?? "";

  return { requests, count, from, to, error, isLoading, refetch, isRefetching };
};

export { useRequests };
