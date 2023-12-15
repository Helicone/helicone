import { supabaseServer } from "../../lib/supabaseServer";
import { useQuery } from "@tanstack/react-query";

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
