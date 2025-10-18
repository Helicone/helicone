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
 * Better hash function (DJB2) to deterministically assign colors based on model name
 * This provides better distribution to avoid color collisions
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  return Math.abs(hash);
}

/**
 * Sorts data by value descending and assigns colors in specified order
 * Items with name "n/a" are sorted to the end
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
    .sort((a, b) => {
      // Push "n/a" items to the end
      if (a.name === "n/a" && b.name !== "n/a") return 1;
      if (b.name === "n/a" && a.name !== "n/a") return -1;
      // Otherwise sort by value descending
      return b.value - a.value;
    })
    .map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
}

/**
 * Sorts data by value descending and assigns colors deterministically based on name
 * This ensures the same model gets the same color across different charts
 * Items with name "n/a" are sorted to the end
 */
export function sortAndColorDataByName<T extends { name: string; value: number }>(
  data: T[] | undefined,
): DataWithColor[] {
  if (!data) return [];

  return data
    .map((item) => ({
      name: item.name || "n/a",
      value: item.value,
    }))
    .sort((a, b) => {
      // Push "n/a" items to the end
      if (a.name === "n/a" && b.name !== "n/a") return 1;
      if (b.name === "n/a" && a.name !== "n/a") return -1;
      // Otherwise sort by value descending
      return b.value - a.value;
    })
    .map((item) => ({
      ...item,
      color: LIST_COLORS[hashString(item.name) % LIST_COLORS.length],
    }));
}
