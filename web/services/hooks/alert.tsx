import { supabaseServer } from "../../lib/supabaseServer";
import { useQuery } from "@tanstack/react-query";

/**
 * Custom hook for fetching alert data from Supabase.
 * @returns An object containing the fetched alert data, loading state, refetch function, and error.
 */
export const useAlert = (orgId: string) => {
  const supabase = supabaseServer;
  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["alert", orgId],
    queryFn: async () => {
      return await supabase
        .from("alert")
        .select("*")
        .eq("soft_delete", false)
        .eq("org_id", orgId);
    },
    refetchOnWindowFocus: false,
  });

  return {
    alert: data,
    alertIsLoading: isLoading || isRefetching,
    refetchAlert: refetch,
    error,
  };
};

/**
 * Custom hook for retrieving alert history.
 * @returns An object containing alert history data, loading state, refetch function, and error state.
 */
export const useAlertHistory = (orgId: string) => {
  const supabase = supabaseServer;
  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["alert_history", orgId],
    queryFn: async () => {
      return await supabase
        .from("alert_history")
        .select("*")
        .eq("soft_delete", false)
        .eq("org_id", orgId);
    },
    refetchOnWindowFocus: false,
  });

  return {
    alertHistory: data,
    alertHistoryIsLoading: isLoading || isRefetching,
    refetchAlertHistory: refetch,
    error,
  };
};
