import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { useTimeFilterQuery } from "@/hooks/useTimeFilterQuery";
import { useEvaluators } from "../evals/EvaluatorHook";
import {
  OnlineEvaluatorConfig,
  useOnlineEvaluators,
} from "./hooks/useOnlineEvaluators";
import MonitoringVisualization from "./MonitoringVisualization";
import MonitoringConfigPanel from "./components/MonitoringConfigPanel";
import { useMonitoringConfigState } from "./store/monitoringConfigStore";
import CreateOnlineEvaluatorCard from "./cards/CreateOnlineEvaluatorCard";

import { addDays, addHours, addMinutes } from "date-fns";
import { H1, P } from "@/components/ui/typography";

const MONITORING_QUICK_SELECT_RANGES = [
  {
    label: "30m",
    value: () => ({ from: addMinutes(new Date(), -30), to: new Date() }),
  },
  {
    label: "1h",
    value: () => ({ from: addHours(new Date(), -1), to: new Date() }),
  },
  {
    label: "3h",
    value: () => ({ from: addHours(new Date(), -3), to: new Date() }),
  },
  {
    label: "12h",
    value: () => ({ from: addHours(new Date(), -12), to: new Date() }),
  },
  {
    label: "1d",
    value: () => ({ from: addDays(new Date(), -1), to: new Date() }),
  },
  {
    label: "3d",
    value: () => ({ from: addDays(new Date(), -3), to: new Date() }),
  },
  {
    label: "7d",
    value: () => ({ from: addDays(new Date(), -7), to: new Date() }),
  },
  {
    label: "30d",
    value: () => ({ from: addDays(new Date(), -30), to: new Date() }),
  },
];

const MonitoringPage: React.FC = () => {
  const { setNotification } = useNotification();

  const { timeFilter, onTimeSelectHandler } = useTimeFilterQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    chartSelections,
    getChartSelectionsEntries,
    removeChartSelection,
    updateChartSelection,
  } = useMonitoringConfigState();
  const [selectedEvaluatorIdForDialog, setSelectedEvaluatorIdForDialog] =
    useState<string>("");
  const { evaluators: evaluatorsQuery } = useEvaluators();
  const evaluators = evaluatorsQuery.data?.data?.data || [];

  const {
    onlineEvaluators: onlineEvaluatorsData,
    createOnlineEvaluator: createOnlineEvaluatorMutation,
    refetchOnlineEvaluators,
  } = useOnlineEvaluators(selectedEvaluatorIdForDialog);

  const getEvaluatorName = (onlineEvaluatorId: string) => {
    const onlineEvaluator = onlineEvaluatorsData?.find(
      (evaluator) => evaluator.id === onlineEvaluatorId
    );

    if (!onlineEvaluator) return null;

    if (onlineEvaluator.name) {
      return onlineEvaluator.name;
    }

    // If online evaluator doesn't have a name, use the evaluator name + " Monitor"
    const evaluator = evaluators.find((e) => e.id === onlineEvaluator.id);
    return evaluator ? `${evaluator.name} Monitor` : "Name N/A";
  };

  // Wrapper for online evaluator creation
  const createOnlineEvaluator = useMutation({
    mutationFn: async (data: { config: OnlineEvaluatorConfig }) => {
      return await createOnlineEvaluatorMutation.mutateAsync(data);
    },
    onSuccess: () => {
      setDialogOpen(false);
      refetchOnlineEvaluators();
      setNotification("Online evaluator created!", "success");
    },
  });

  const handleOpenOnlineEvaluatorDialog = () => {
    const { selectedEvaluatorId } = useMonitoringConfigState.getState();
    setSelectedEvaluatorIdForDialog(selectedEvaluatorId);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-6">
          <H1 className="text-2xl font-bold">Online Evaluation Monitoring</H1>
          <ThemedTimeFilter
            timeFilterOptions={[]}
            quickSelectOptions={MONITORING_QUICK_SELECT_RANGES}
            onSelect={onTimeSelectHandler}
            isFetching={false}
            defaultValue={"24h"}
            currentTimeFilter={timeFilter}
            custom={true}
          />
        </div>

        {/* Evaluator selection panel */}
        <MonitoringConfigPanel
          onOpenOnlineEvaluatorDialog={handleOpenOnlineEvaluatorDialog}
        />

        {/* Chart selection cards */}
        <div className="px-6">
          <div className="w-full overflow-hidden">
            <div className="relative flex justify-center items-center">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide w-full">
                {chartSelections.length === 0 && (
                  <div className="flex items-center justify-center h-[200px] w-full border rounded-lg p-6">
                    <div className="text-center">
                      <P className="text-muted-foreground mb-2">
                        No chart configurations added yet
                      </P>
                      <P className="text-sm text-muted-foreground">
                        Configure your evaluator and chart types above, then
                        click &quot;Add to Dashboard&quot;
                      </P>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts section */}
        {chartSelections.length > 0 && (
          <div className="px-6">
            <Card className="p-6">
              <CardContent>
                <MonitoringVisualization />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog for creating new online evaluator */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Online Evaluator</DialogTitle>
              <DialogDescription>
                Configure how to sample live requests to evaluate.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedEvaluatorIdForDialog && (
                <CreateOnlineEvaluatorCard
                  onSave={(data) => {
                    createOnlineEvaluator.mutate(data);
                  }}
                  isLoading={createOnlineEvaluator.isLoading}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MonitoringPage;
