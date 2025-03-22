import React, { useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart, PieChart, Save, Plus } from "lucide-react";
import { useEvaluators } from "../../evals/EvaluatorHook";
import { useOnlineEvaluators } from "../hooks/useOnlineEvaluators";
import { useMonitoringConfigState } from "../store/monitoringConfigStore";
import { ChartView } from "../MonitoringVisualization";
import { MultiSelect, SelectOption } from "@/components/ui/multi-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMonitoringDashboard } from "../hooks/useMonitoringDashboard";
import { useRouter } from "next/router";
import { H2 } from "@/components/ui/typography";

const CHART_TYPES: SelectOption[] = [
  { value: "time", label: "Trend", icon: <TrendingUp className="h-4 w-4" /> },
  {
    value: "distribution",
    label: "Histogram",
    icon: <BarChart className="h-4 w-4" />,
  },
  { value: "pie", label: "Pie", icon: <PieChart className="h-4 w-4" /> },
];

interface EvaluatorSelectionPanelProps {
  onOpenOnlineEvaluatorDialog: () => void;
}

function availableChartTypes(scoreType: string): SelectOption[] {
  let chartTypes: ChartView[];
  switch (scoreType) {
    case "LLM-BOOLEAN":
      chartTypes = [ChartView.PIE, ChartView.DISTRIBUTION];
      break;
    case "LLM-CHOICE":
      chartTypes = [ChartView.PIE, ChartView.DISTRIBUTION];
      break;
    case "LLM-RANGE":
      chartTypes = [ChartView.TIME, ChartView.PIE, ChartView.DISTRIBUTION];
      break;
    default:
      chartTypes = [];
  }
  return CHART_TYPES.filter((option) =>
    chartTypes.includes(option.value as ChartView)
  );
}

const MonitoringConfigPanel: React.FC<EvaluatorSelectionPanelProps> = ({
  onOpenOnlineEvaluatorDialog,
}) => {
  const router = useRouter();

  const {
    selectedEvaluatorId,
    selectedOnlineEvaluatorId,
    selectedChartTypes,
    chartSelections,
    hasUnsavedChanges,
    setSelectedEvaluatorId,
    setSelectedOnlineEvaluatorId,
    setSelectedChartTypes,
    addChartSelection,
    setHasUnsavedChanges,
  } = useMonitoringConfigState();

  const { dashboard, isLoadingDashboard, upsertDashboard } =
    useMonitoringDashboard();

  const { evaluators: evaluatorsQuery } = useEvaluators();
  const evaluators = evaluatorsQuery.data?.data?.data || [];
  const isLoadingEvaluators = evaluatorsQuery.isLoading;

  const selectedEvaluator = useMemo(
    () => evaluators.find((e) => e.id === selectedEvaluatorId),
    [evaluators, selectedEvaluatorId]
  );

  const availableOptions = useMemo(
    () => availableChartTypes(selectedEvaluator?.scoring_type || ""),
    [selectedEvaluator]
  );

  // Filter selected chart types to only include available options for the current evaluator
  const selectedChartOptions = useMemo(
    () =>
      availableOptions.filter((option) =>
        selectedChartTypes.includes(option.value as ChartView)
      ),
    [availableOptions, selectedChartTypes]
  );

  // Update selected chart types when evaluator changes
  useEffect(() => {
    // Reset selected chart types when evaluator changes
    if (selectedEvaluatorId) {
      // Filter to keep only chart types that are valid for this evaluator
      const validChartTypes = selectedChartTypes.filter((chartType) =>
        availableOptions.some((option) => option.value === chartType)
      );

      // If the filtered list is different from the current selection, update it
      if (validChartTypes.length !== selectedChartTypes.length) {
        setSelectedChartTypes(validChartTypes);
      }
    } else {
      // If no evaluator is selected, clear chart types
      setSelectedChartTypes([]);
    }
  }, [selectedEvaluatorId, availableOptions]);

  const { onlineEvaluators: onlineEvaluatorsData, isLoadingOnlineEvaluators } =
    useOnlineEvaluators(selectedEvaluatorId);

  const handleSelectEvaluator = (id: string) => {
    setSelectedEvaluatorId(id);
    setSelectedOnlineEvaluatorId(""); // Reset online evaluator when evaluator changes
  };

  const handleChartTypeChange = (selected: SelectOption[]) => {
    setSelectedChartTypes(selected.map((option) => option.value as ChartView));
  };

  // Initialize chartSelections with dashboard data on load
  useEffect(() => {
    if (dashboard && dashboard.length > 0 && chartSelections.length === 0) {
      // Only initialize if store is empty to avoid overwriting user changes
      const typedSelections = dashboard.map((selection) => ({
        evaluatorId: selection.evaluatorId,
        onlineEvaluatorId: selection.onlineEvaluatorId,
        chartTypes: selection.chartTypes.map((type) => {
          if (type === "time") return ChartView.TIME;
          if (type === "distribution") return ChartView.DISTRIBUTION;
          if (type === "pie") return ChartView.PIE;
          return type as ChartView;
        }),
      }));

      // Update the store with the remote data
      typedSelections.forEach((selection) => {
        setSelectedEvaluatorId(selection.evaluatorId);
        setSelectedOnlineEvaluatorId(selection.onlineEvaluatorId);
        setSelectedChartTypes(selection.chartTypes);
        addChartSelection();
      });
    }
  }, [dashboard]);

  const handleSaveDashboard = () => {
    upsertDashboard.mutate(chartSelections);
    setHasUnsavedChanges(false);
  };

  const initialMountRef = React.useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      // This ensures that when the component first mounts, hasUnsavedChanges is reset to false
      setHasUnsavedChanges(false);
      initialMountRef.current = false;
    }
  }, []);

  // Set first evaluator as selected on initial mount if no evaluator is selected
  const initialEvaluatorRef = React.useRef(true);
  useEffect(() => {
    if (
      initialEvaluatorRef.current &&
      !isLoadingEvaluators &&
      evaluators.length > 0 &&
      !selectedEvaluatorId &&
      !dashboard?.length
    ) {
      // Only set if there's no dashboard data and no selected evaluator
      setSelectedEvaluatorId(evaluators[0].id);
      initialEvaluatorRef.current = false;
    }
  }, [isLoadingEvaluators, evaluators, selectedEvaluatorId, dashboard]);

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="bg-secondary/10 border-2 border-primary rounded-lg p-6">
          <H2 className="text-2xl font-heading">Chart Configuration</H2>
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-4 flex items-end gap-4">
              <div className="space-y-2 w-1/2">
                <label className="text-sm text-muted-foreground">
                  Evaluator
                </label>
                {isLoadingEvaluators ? (
                  <Select disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Loading evaluators..." />
                    </SelectTrigger>
                  </Select>
                ) : evaluators.length === 0 ? (
                  <Button
                    className="w-full h-8"
                    onClick={() => router.push("/evaluators")}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Evaluator
                  </Button>
                ) : (
                  <Select
                    value={selectedEvaluatorId}
                    onValueChange={handleSelectEvaluator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an evaluator" />
                    </SelectTrigger>
                    <SelectContent>
                      {evaluators.map((evaluator) => (
                        <SelectItem key={evaluator.id} value={evaluator.id}>
                          <span className="flex overflow-hidden">
                            <span className="truncate">{evaluator.name}</span>
                            {evaluator.scoring_type && (
                              <span className="text-muted-foreground ml-1 truncate max-w-[40%] text-ellipsis">
                                ({evaluator.scoring_type})
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2 w-1/2">
                <label className="text-sm text-muted-foreground">
                  Online Evaluator
                </label>
                {selectedEvaluatorId &&
                !isLoadingOnlineEvaluators &&
                onlineEvaluatorsData?.length === 0 ? (
                  <Button
                    className="w-full h-8 px-3 py-2 text-left justify-start font-normal"
                    onClick={onOpenOnlineEvaluatorDialog}
                    variant="outline"
                  >
                    None - Create one!
                  </Button>
                ) : (
                  <Select
                    value={selectedOnlineEvaluatorId}
                    onValueChange={setSelectedOnlineEvaluatorId}
                    disabled={isLoadingOnlineEvaluators || !selectedEvaluatorId}
                  >
                    <SelectTrigger className="w-full text-left">
                      <SelectValue
                        placeholder={
                          !selectedEvaluatorId
                            ? "Select an evaluator first"
                            : isLoadingOnlineEvaluators
                            ? "Loading samplers..."
                            : "Select a sampler"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {onlineEvaluatorsData?.map((evaluator) => (
                        <Tooltip key={evaluator.id}>
                          <TooltipTrigger asChild>
                            <SelectItem value={evaluator.id}>
                              {evaluator.name || "Name N/A"}
                            </SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Sample Rate:{" "}
                            {(
                              evaluator.config as {
                                sampleRate?: string | number;
                              }
                            ).sampleRate || "N/A"}
                            %
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="col-span-8 space-y-2">
              <label className="text-sm text-muted-foreground">
                Chart Types
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <MultiSelect
                    options={availableOptions}
                    selected={selectedChartOptions}
                    onChange={handleChartTypeChange}
                    placeholder="Select chart types"
                    className="flex-1 h-10"
                  />
                </div>
                <Button
                  className="h-8 whitespace-nowrap"
                  size="default"
                  onClick={addChartSelection}
                  disabled={
                    !selectedEvaluatorId ||
                    !selectedOnlineEvaluatorId ||
                    selectedChartTypes.length === 0
                  }
                >
                  Add to Dashboard
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 whitespace-nowrap"
                      size="default"
                      variant="outline"
                      onClick={handleSaveDashboard}
                      disabled={isLoadingDashboard || !hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Save current dashboard configuration
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MonitoringConfigPanel;
