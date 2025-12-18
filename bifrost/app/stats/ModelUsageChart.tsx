"use client";

import { UsageChart, UsageChartDataPoint } from "./components/UsageChart";

interface ModelTokens {
  model: string;
  totalTokens: number;
}

interface TimeSeriesDataPoint {
  time: string;
  models: ModelTokens[];
}

interface ModelUsageChartProps {
  data: TimeSeriesDataPoint[];
  isLoading: boolean;
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y";
}

export function ModelUsageChart({
  data,
  isLoading,
  timeframe,
}: ModelUsageChartProps) {
  const chartData: UsageChartDataPoint[] = data.map((point) => ({
    time: point.time,
    items: point.models.map((m) => ({
      name: m.model,
      totalTokens: m.totalTokens,
    })),
  }));

  return (
    <UsageChart
      data={chartData}
      isLoading={isLoading}
      timeframe={timeframe}
    />
  );
}
