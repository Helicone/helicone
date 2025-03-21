import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery, useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { ChartView } from "../MonitoringVisualization";
import { useOrg } from "@/components/layout/org/organizationContext";

export interface ChartSelection {
  evaluatorId: string;
  onlineEvaluatorId: string;
  chartTypes: ChartView[];
}

export function useMonitoringDashboard() {
  const org = useOrg();
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["monitoring-dashboard", org?.currentOrg?.id],
    queryFn: async () => {
      return await jawn.GET("/v1/monitoring/dashboard");
    },
  });

  const upsertDashboard = useMutation({
    mutationFn: async (config: ChartSelection[]) => {
      await jawn.PUT("/v1/monitoring/dashboard", {
        body: { config },
      });
    },
    onSuccess: () => {
      setNotification("Dashboard created successfully!", "success");
      refetchDashboard();
    },
    onError: (error: Error) => {
      console.error("Error creating dashboard:", error);
      setNotification("Error creating dashboard", "error");
    },
  });

  const deleteDashboard = useMutation({
    mutationFn: async () => {
      await jawn.DELETE("/v1/monitoring/dashboard");
    },
    onSuccess: () => {
      setNotification("Dashboard deleted successfully", "success");
      refetchDashboard();
    },
    onError: (error: Error) => {
      console.error("Error deleting dashboard:", error);
      setNotification("Error deleting dashboard", "error");
    },
  });

  return {
    dashboard: dashboard?.data?.data || [],
    isLoadingDashboard,
    refetchDashboard,
    upsertDashboard,
    deleteDashboard,
  };
}
