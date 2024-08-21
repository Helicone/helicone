import { useQuery } from "@tanstack/react-query";

import { getJawnClient } from "../../../lib/clients/jawn";

const useAlertsPage = (orgId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const jawn = getJawnClient();
      const res = await jawn.GET("/v1/alert/query");

      if (res.error || !res.data) {
        return {
          alert: [],
          alertHistory: [],
        };
      }

      const alert = res.data.data?.alerts;
      const alertHistory = res.data.data?.history;

      return {
        alert,
        alertHistory,
      };
    },
  });

  return {
    alerts: data?.alert || [],
    alertHistory:
      data?.alertHistory?.sort(
        (a, b) =>
          new Date(b.alert_start_time).getTime() -
          new Date(a.alert_start_time).getTime()
      ) || [],
    isLoading,
    refetch,
  };
};

export default useAlertsPage;
