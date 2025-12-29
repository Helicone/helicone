/**
 * Format a token count into a human-readable string (e.g., 1.5B, 2.3M, 500K).
 */
export function formatTokens(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "0";
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

/**
 * Format a percentage change with sign (e.g., +25%, -10%).
 */
export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(0)}%`;
}

/**
 * Format a date string for chart X-axis labels.
 */
export function formatTimeLabel(
  time: string,
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y"
): string {
  const date = new Date(time);
  if (timeframe === "24h") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (timeframe === "7d") {
    return date.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Format a date string for tooltip display.
 */
export function formatTooltipDate(time: string): string {
  const date = new Date(time);
  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
