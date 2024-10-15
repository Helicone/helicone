export function formatLargeNumber(value: number, roundLow?: boolean): string {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (value >= 0.01) {
    return value.toLocaleString("en-US");
  }

  if (roundLow) {
    return "0";
  }
  return value.toFixed(5);
}
