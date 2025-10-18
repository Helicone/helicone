export const LIST_COLORS = ["purple", "blue", "green", "yellow", "orange"] as const;

export type ListColor = (typeof LIST_COLORS)[number];

export interface DataWithColor {
  name: string;
  value: number;
  color: ListColor;
}

/**
 * Sorts data by value descending and assigns sequential colors
 */
export function sortAndColorData<T extends { name: string; value: number }>(
  data: T[] | undefined,
): DataWithColor[] {
  if (!data) return [];

  return data
    .map((item) => ({
      name: item.name || "n/a",
      value: item.value,
    }))
    .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))
    .map((item, index) => ({
      ...item,
      color: LIST_COLORS[index % LIST_COLORS.length],
    }));
}
