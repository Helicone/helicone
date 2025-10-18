export const LIST_COLORS = ["blue", "purple", "cyan", "green", "pink", "orange", "yellow"] as const;

export type ListColor = (typeof LIST_COLORS)[number];

export interface DataWithColor {
  name: string;
  value: number;
  color: ListColor;
}

// Different hardcoded color orders for each panel
const COLOR_ORDERS = {
  default: ["purple", "cyan", "orange", "green", "pink", "blue", "yellow"] as ListColor[],
  alt1: ["blue", "pink", "yellow", "purple", "cyan", "green", "orange"] as ListColor[],
  alt2: ["green", "orange", "purple", "cyan", "yellow", "blue", "pink"] as ListColor[],
};

/**
 * Sorts data by value descending and assigns colors in specified order
 */
export function sortAndColorData<T extends { name: string; value: number }>(
  data: T[] | undefined,
  colorOrder: keyof typeof COLOR_ORDERS = "default",
): DataWithColor[] {
  if (!data) return [];

  const colors = COLOR_ORDERS[colorOrder];

  return data
    .map((item) => ({
      name: item.name || "n/a",
      value: item.value,
    }))
    .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))
    .map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
}
