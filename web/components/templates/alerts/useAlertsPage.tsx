import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

const useAlertsPage = (orgId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      const alert = res.data
        .alert as Database["public"]["Tables"]["alert"]["Row"][];
      const alertHistory = res.data
        .alertHistory as Database["public"]["Tables"]["alert_history"]["Row"][];

      return {
        alert,
        alertHistory,
      };
    },
  });

  return {
    alerts: data?.alert || [],
    alertHistory:
      data?.alertHistory.sort(
        (a, b) =>
          new Date(b.alert_start_time).getTime() -
          new Date(a.alert_start_time).getTime()
      ) || [],
    isLoading,
    refetch,
  };
};

export default useAlertsPage;
