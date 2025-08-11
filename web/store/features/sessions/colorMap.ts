import { TreeNodeData } from "@/lib/sessions/sessionTypes";
import { create } from "zustand";
export type ColorMap = Record<string, string>;

const SKY_BLUE = "#82C8E5";

interface ColorMapStore {
  colorMap: ColorMap;
  setColorMap: (colorMap: ColorMap) => void;
  setColor: (path: string, color: string) => void;
  getColor: (path: string, isDarkMode?: boolean) => string;
  initializeColorMap: (treeData: TreeNodeData) => void;
}

export const useColorMapStore = create<ColorMapStore>((set, get) => ({
  colorMap: {},
  setColorMap: (colorMap) => set({ colorMap }),
  setColor: (path: string, color: string) =>
    set((state) => ({
      colorMap: { ...state.colorMap, [path]: color },
    })),
  getColor: (path: string, isDarkMode = false) => {
    return get().colorMap[path] || "chart-1";
  },
  initializeColorMap: (treeData: TreeNodeData) => {
    const newColorMap = setAllPathColors(treeData, {}, null);
    set({ colorMap: newColorMap });
  },
}));

function setAllPathColors(
  treeData: TreeNodeData,
  colors: ColorMap,
  parentColor: string | null = null,
): ColorMap {
  // Skip if node has no children
  if (!treeData.children?.length) return colors;

  for (const child of treeData.children) {
    if (parentColor === null) {
      // For top-level nodes, generate a unique color
      const randomColor = generateUniqueColor(colors);
      colors[child.currentPath] = randomColor;
      setAllPathColors(child, colors, randomColor);
    } else {
      // For nested nodes, inherit parent's color
      colors[child.currentPath] = parentColor;
      setAllPathColors(child, colors, parentColor);
    }
  }
  return colors;
}

const toHex = (n: number) => {
  const hex = n.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

function generateUniqueColor(existingColors: ColorMap): string {
  const chartColors = [
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

  const colorIndex = Object.keys(existingColors).length;
  return chartColors[colorIndex % chartColors.length];
}
