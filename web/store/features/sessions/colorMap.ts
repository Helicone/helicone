import { create } from "zustand";
export type ColorMap = Record<string, string>;

const SKY_BLUE = "#82C8E5";

interface ColorMapStore {
  colorMap: ColorMap;
  setColorMap: (colorMap: ColorMap) => void;
  setColor: (path: string, color: string) => void;
  getColor: (path: string) => string;
}

export const useColorMapStore = create<ColorMapStore>((set, get) => ({
  colorMap: {},
  setColorMap: (colorMap) => set({ colorMap }),
  setColor: (path: string, color: string) =>
    set((state) => ({
      colorMap: { ...state.colorMap, [path]: color },
    })),
  getColor: (path: string) => get().colorMap[path] || SKY_BLUE,
}));
