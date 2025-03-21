import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChartView } from "../MonitoringVisualization";

export interface ChartSelection {
  evaluatorId: string;
  onlineEvaluatorId: string;
  chartTypes: ChartView[];
}

interface MonitoringConfigState {
  // The id of the evaluator selected in the dropdown
  selectedEvaluatorId: string;
  // The id of the online evaluator selected in the dropdown
  selectedOnlineEvaluatorId: string;
  // The chart types selected in the multi-select
  selectedChartTypes: ChartView[];
  // The local UI dashboard configuration state
  chartSelections: ChartSelection[];
  // Whether the dashboard has unsaved changes
  hasUnsavedChanges: boolean;

  // actions

  setSelectedEvaluatorId: (id: string) => void;
  setSelectedOnlineEvaluatorId: (id: string) => void;
  setSelectedChartTypes: (types: ChartView[]) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  // add the currently selected evaluator, online evaluator, and associated chart types to the local chartSelections state
  addChartSelection: () => void;
  removeChartSelection: (index: number) => void;
  updateChartSelection: (
    index: number,
    updatedSelection: ChartSelection
  ) => void;
  getChartSelectionsEntries: () => [ChartSelection, ChartView[]][];
}

export const useMonitoringConfigState = create<MonitoringConfigState>()(
  persist(
    (set, get) => ({
      selectedEvaluatorId: "",
      selectedOnlineEvaluatorId: "",
      selectedChartTypes: [],
      chartSelections: [],
      hasUnsavedChanges: false,

      setSelectedEvaluatorId: (id: string) =>
        set({ selectedEvaluatorId: id, selectedOnlineEvaluatorId: "" }),

      setSelectedOnlineEvaluatorId: (id: string) =>
        set({ selectedOnlineEvaluatorId: id }),

      setSelectedChartTypes: (types: ChartView[]) =>
        set({ selectedChartTypes: types }),

      setHasUnsavedChanges: (hasChanges: boolean) =>
        set({ hasUnsavedChanges: hasChanges }),

      addChartSelection: () => {
        const {
          selectedEvaluatorId,
          selectedOnlineEvaluatorId,
          selectedChartTypes,
          chartSelections,
        } = get();

        if (
          !selectedEvaluatorId ||
          !selectedOnlineEvaluatorId ||
          selectedChartTypes.length === 0
        ) {
          return;
        }

        const existingSelection = chartSelections.find(
          (selection) =>
            selection.evaluatorId === selectedEvaluatorId &&
            selection.onlineEvaluatorId === selectedOnlineEvaluatorId
        );

        if (existingSelection) {
          return;
        }

        set({
          chartSelections: [
            ...chartSelections,
            {
              evaluatorId: selectedEvaluatorId,
              onlineEvaluatorId: selectedOnlineEvaluatorId,
              chartTypes: selectedChartTypes,
            },
          ],
          hasUnsavedChanges: true,
        });
      },

      removeChartSelection: (index: number) => {
        const { chartSelections } = get();
        console.log("Removing chart selection", index);
        set({
          chartSelections: chartSelections.filter((_, i) => i !== index),
          hasUnsavedChanges: true,
        });
      },

      updateChartSelection: (
        index: number,
        updatedSelection: ChartSelection
      ) => {
        const { chartSelections } = get();
        const newSelections = [...chartSelections];
        if (index >= 0 && index < newSelections.length) {
          newSelections[index] = updatedSelection;
          set({
            chartSelections: newSelections,
            hasUnsavedChanges: true,
          });
        }
      },

      getChartSelectionsEntries: () => {
        const { chartSelections } = get();
        return chartSelections.map(
          (selection) =>
            [selection, selection.chartTypes] as [ChartSelection, ChartView[]]
        );
      },
    }),
    {
      name: "monitoring-config-storage",
    }
  )
);
