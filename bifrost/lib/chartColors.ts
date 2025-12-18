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
  projection: "hsla(240, 4%, 46%, 0.4)",
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
