import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Column } from "../../components/ThemedTableV2";
import { getRequests } from "../lib/requests";

const useRequests = (
  currentTimeFilter: string | null,
  currentPage: number,
  currentPageSize: number,
  sortBy: string | null,
  advancedFilter?: {
    idx: number;
    type?: "number" | "text" | "datetime-local" | undefined;
    supabaseKey?: string | undefined;
    value?: string | undefined;
    column?: Column | undefined;
    operator?: "eq" | "gt" | "lt";
  }[]
) => {
  const supabase = useSupabaseClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "requests",
      currentTimeFilter,
      currentPage,
      currentPageSize,
      sortBy,
      advancedFilter,
    ],
    queryFn: async (query) => {
      return getRequests(
        supabase,
        query.queryKey[2] as number,
        query.queryKey[3] as number,
        query.queryKey[4] as string | null,
        query.queryKey[1] as string | null,
        query.queryKey[5] as {
          idx: number;
          type?: "number" | "text" | "datetime-local" | undefined;
          supabaseKey?: string | undefined;
          value?: string | undefined;
          column?: Column | undefined;
          operator?: "eq" | "gt" | "lt";
        }[]
      ).then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const requests = data?.data;
  const count = data?.count;
  const from = data?.from;
  const to = data?.to;
  const error = data?.error;

  return { requests, count, from, to, error, isLoading, refetch, isRefetching };
};

export { useRequests };
