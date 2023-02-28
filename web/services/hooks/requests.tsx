import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { Column } from "../../components/ThemedTableV2";
import { getRequests } from "../lib/requests";
=======
import { Database } from "../../supabase/database.types";
import { getRequests, ResponseAndRequest } from "../lib/requests";
>>>>>>> origin/main

const useRequests = (
  currentTimeFilter: string | null,
  currentPage: number,
  currentPageSize: number,
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main

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

  const requests = data?.data ?? [];
  const count = data?.count ?? 0;
  const from = data?.from ?? 0;
  const to = data?.to ?? 0;
  const error = data?.error?.message ?? "";

  return { requests, count, from, to, error, isLoading, refetch, isRefetching };
};

export { useRequests };
