import { useQuery } from "@tanstack/react-query";

import { getJawnClient } from "../../../lib/clients/jawn";

const useAlertsPage = (
  orgId: string,
  historyPage: number = 0,
  historyPageSize: number = 25,
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["alerts", { historyPage, historyPageSize }],
    queryFn: async () => {
      const jawn = getJawnClient();
      const res = await jawn.GET("/v1/alert/query", {
        params: {
          query: {
            historyPage,
            historyPageSize,
          },
        },
      });

      if (res.error || !res.data) {
        return {
          alert: [],
          alertHistory: [],
          historyTotalCount: 0,
        };
      }

      const alert = res.data.data?.alerts;
      const alertHistory = res.data.data?.history;
      const historyTotalCount = res.data.data?.historyTotalCount || 0;

      return {
        alert,
        alertHistory,
        historyTotalCount,
      };
    },
  });

  return {
    alerts: data?.alert || [],
    // Backend handles sorting, so no need to sort on frontend
    alertHistory: data?.alertHistory || [],
    historyTotalCount: data?.historyTotalCount || 0,
    isLoading,
    refetch,
  };
};

export default useAlertsPage;
