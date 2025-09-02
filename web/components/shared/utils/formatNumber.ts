import { formatWithSignificantFigures } from "./smartNumberFormat";

export function formatNumber(num: number): string {
  return formatWithSignificantFigures(num, { maxSignificantFigures: 8 });
}

