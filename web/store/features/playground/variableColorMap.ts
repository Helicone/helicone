import { create } from "zustand";

export type VariableColorMap = Record<string, string>;

interface VariableColorMapStore {
  colorMap: VariableColorMap;
  setColorMap: (colorMap: VariableColorMap) => void;
  setColor: (variableName: string, color: string) => void;
  getColor: (variableName: string) => string;
  initializeColorMap: (variables: string[]) => void;
}

const CHART_COLORS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
  "chart-9",
  "chart-10",
];

export const useVariableColorMapStore = create<VariableColorMapStore>((set, get) => ({
  colorMap: {},
  setColorMap: (colorMap) => set({ colorMap }),
  setColor: (variableName: string, color: string) =>
    set((state) => ({
      colorMap: { ...state.colorMap, [variableName]: color },
    })),
  getColor: (variableName: string) => {
    return get().colorMap[variableName] || "chart-1";
  },
  initializeColorMap: (variables: string[]) => {
    const newColorMap: VariableColorMap = {};
    variables.forEach((variable, index) => {
      newColorMap[variable] = CHART_COLORS[index % CHART_COLORS.length];
    });
    set({ colorMap: newColorMap });
  },
})); 