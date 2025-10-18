// Shared chart color palette for dashboard and analytics
// Intense, high-saturation colors for maximum visual impact

export const CHART_COLORS = {
  // Primary metrics
  success: "hsl(145, 80%, 42%)", // Electric green
  error: "hsl(0, 100%, 50%)", // Pure bright red

  // Secondary metrics
  blue: "hsl(217, 100%, 55%)", // Electric blue
  purple: "hsl(271, 100%, 60%)", // Intense purple
  orange: "hsl(25, 100%, 50%)", // Blazing orange
  cyan: "hsl(185, 100%, 40%)", // Neon cyan
  pink: "hsl(330, 100%, 55%)", // Hot pink
  yellow: "hsl(48, 100%, 50%)", // Bright yellow
  indigo: "hsl(243, 100%, 62%)", // Vivid indigo
  teal: "hsl(173, 100%, 35%)", // Deep teal

  // Tremor color names (for backward compatibility with Tremor charts)
  tremor: {
    blue: "blue",
    cyan: "cyan",
    orange: "orange",
    violet: "violet",
    amber: "amber",
    green: "green",
    red: "red",
    purple: "purple",
    pink: "pink",
    yellow: "yellow",
    indigo: "indigo",
  },
} as const;

// Color arrays for multi-line charts
export const CHART_COLOR_PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.yellow,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
] as const;

// Tremor color palette for charts still using Tremor
export const TREMOR_COLOR_PALETTE = [
  CHART_COLORS.tremor.blue,
  CHART_COLORS.tremor.purple,
  CHART_COLORS.tremor.orange,
  CHART_COLORS.tremor.cyan,
  CHART_COLORS.tremor.pink,
  CHART_COLORS.tremor.yellow,
  CHART_COLORS.tremor.indigo,
] as const;
