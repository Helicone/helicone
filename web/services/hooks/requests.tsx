import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Column } from "../../components/ThemedTableV2";
import { getRequests } from "../lib/requests";

const useGetRequests = (
  currentTimeFilter: string | null,
  currentPage: number,
  currentPageSize: number,
  sortBy: string | null,
  advancedFilters?: {
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
    queryKey: ["requests"],
    queryFn: async () => {
      return getRequests(
        supabase,
        currentPage,
        currentPageSize,
        sortBy,
        currentTimeFilter,
        advancedFilters
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

export { useGetRequests };
