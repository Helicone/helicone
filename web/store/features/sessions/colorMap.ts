import { TreeNodeData } from "@/lib/sessions/sessionTypes";
import { create } from "zustand";
export type ColorMap = Record<string, string>;

const SKY_BLUE = "#82C8E5";

interface ColorMapStore {
  colorMap: ColorMap;
  setColorMap: (colorMap: ColorMap) => void;
  setColor: (path: string, color: string) => void;
  getColor: (path: string) => string;
  initializeColorMap: (treeData: TreeNodeData) => void;
}

export const useColorMapStore = create<ColorMapStore>((set, get) => ({
  colorMap: {},
  setColorMap: (colorMap) => set({ colorMap }),
  setColor: (path: string, color: string) =>
    set((state) => ({
      colorMap: { ...state.colorMap, [path]: color },
    })),
  getColor: (path: string) => get().colorMap[path] || SKY_BLUE,
  initializeColorMap: (treeData: TreeNodeData) => {
    const newColorMap = setAllPathColors(treeData, {}, null);
    set({ colorMap: newColorMap });
  },
}));

function setAllPathColors(
  treeData: TreeNodeData,
  colors: ColorMap,
  parentColor: string | null = null
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

function generateUniqueColor(existingColors: ColorMap): string {
  // Get the count of existing colors to use as an index for deterministic generation
  const colorIndex = Object.keys(existingColors).length;

  const goldenRatioConjugate = 0.618033988749895;

  // Use only colorIndex for deterministic color generation
  let hue = (colorIndex * goldenRatioConjugate) % 1;

  // Keep colors in the light spectrum
  const saturation = 0.7; // 70% saturation for vibrant but not overwhelming colors

  const depthFactor = Math.min(0.3, (colorIndex % 6) * 0.05);
  const lightness = 0.8 - depthFactor; // Keep colors light but with some variation

  // Convert HSL to hex
  let r, g, b;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  r = hue2rgb(p, q, hue + 1 / 3);
  g = hue2rgb(p, q, hue);
  b = hue2rgb(p, q, hue - 1 / 3);

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
