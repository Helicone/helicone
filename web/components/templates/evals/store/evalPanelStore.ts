import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { PanelType } from "../panels/types";
import { useEvalConfigStore } from "./evalConfigStore";
import { useTestDataStore } from "../testing/testingStore";

interface EvalPanelState {
  panels: PanelType[];
  setPanels: (
    panels: PanelType[] | ((prev: PanelType[]) => PanelType[])
  ) => void;
  addPanel: (panel: PanelType) => void;
  removePanel: (panelType: string) => void;
  openTestPanel: () => void;
  closeTestPanel: () => void;
  openCreatePanel: () => void;
  closeCreatePanel: () => void;
  openEditPanel: (evaluatorId: string) => void;
  closeEditPanel: () => void;
  resetPanels: () => void;
}

const initialState: Pick<EvalPanelState, "panels"> = {
  panels: [{ _type: "main" as const }],
};

export const useEvalPanelStore = create<EvalPanelState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setPanels: (by) => {
          if (typeof by === "function") {
            set((state) => ({ panels: by(state.panels) }));
          } else {
            set({ panels: by });
          }
        },
        addPanel: (panel) => {
          set((state) => {
            // Check if panel of this type already exists
            const exists = state.panels.some((p) => p._type === panel._type);
            if (exists) {
              // If it's an edit panel with a different ID, replace it
              if (panel._type === "edit") {
                return {
                  panels: [
                    ...state.panels.filter((p) => p._type !== "edit"),
                    panel,
                  ],
                };
              }
              // Otherwise, don't add duplicate panel types
              return { panels: state.panels };
            }
            return { panels: [...state.panels, panel] };
          });
        },
        removePanel: (panelType) => {
          set((state) => ({
            panels: state.panels.filter((p) => p._type !== panelType),
          }));
        },
        openTestPanel: () => {
          set((state) => {
            // Check if test panel already exists
            const hasTestPanel = state.panels.some((p) => p._type === "test");
            if (hasTestPanel) return { panels: state.panels };

            // Simply add the test panel without opening the create panel
            return { panels: [...state.panels, { _type: "test" }] };
          });
        },
        closeTestPanel: () => {
          set((state) => ({
            panels: state.panels.filter((p) => p._type !== "test"),
          }));
        },
        openCreatePanel: () => {
          // Access the config stores and reset them
          const resetConfig = useEvalConfigStore.getState().resetConfig;
          const resetTestData = useTestDataStore.getState().resetTestData;

          set((state) => {
            // Reset all stores before opening the panel
            resetConfig();
            resetTestData();

            // Check if create panel already exists
            const hasCreatePanel = state.panels.some(
              (p) => p._type === "create"
            );
            if (hasCreatePanel) return { panels: state.panels };

            // Remove any edit panels before adding the create panel
            const filteredPanels = state.panels.filter(
              (p) => p._type !== "edit"
            );
            return { panels: [...filteredPanels, { _type: "create" }] };
          });
        },
        closeCreatePanel: () => {
          set((state) => ({
            panels: state.panels.filter((p) => p._type !== "create"),
          }));
        },
        openEditPanel: (evaluatorId) => {
          set((state) => {
            // Remove any existing edit panels and create panels
            const filteredPanels = state.panels.filter(
              (p) => p._type !== "edit" && p._type !== "create"
            );
            return {
              panels: [
                ...filteredPanels,
                { _type: "edit", selectedEvaluatorId: evaluatorId },
              ],
            };
          });
        },
        closeEditPanel: () => {
          set((state) => ({
            panels: state.panels.filter((p) => p._type !== "edit"),
          }));
        },
        resetPanels: () => {
          set({ panels: [{ _type: "main" as const }] });
        },
      }),
      {
        name: "eval-panel-store",
        onRehydrateStorage: () => (state) => {
          // When state is rehydrated from localStorage (on page refresh or initial load)
          // Check for any problematic panel configurations and reset if needed
          if (state) {
            const editPanel = state.panels.find(
              (panel) => panel._type === "edit"
            ) as
              | { _type: "edit"; selectedEvaluatorId: string | null }
              | undefined;

            // If we have an edit panel but no selectedEvaluatorId, reset to initial state
            if (
              editPanel &&
              (!editPanel.selectedEvaluatorId ||
                editPanel.selectedEvaluatorId === "")
            ) {
              // Need to use the state.resetPanels() method to properly reset
              setTimeout(() => {
                state.resetPanels();
              }, 0);
            }
          }
        },
      }
    )
  )
);
