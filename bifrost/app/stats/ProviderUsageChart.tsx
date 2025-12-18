"use client";

import { UsageChart, UsageChartDataPoint } from "./components/UsageChart";

interface ProviderTokens {
  provider: string;
  totalTokens: number;
}

interface TimeSeriesDataPoint {
  time: string;
  providers: ProviderTokens[];
}

interface ProviderUsageChartProps {
  data: TimeSeriesDataPoint[];
  isLoading: boolean;
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y";
}

export function ProviderUsageChart({
  data,
  isLoading,
  timeframe,
}: ProviderUsageChartProps) {
  const chartData: UsageChartDataPoint[] = data.map((point) => ({
    time: point.time,
    items: point.providers.map((p) => ({
      name: p.provider,
      totalTokens: p.totalTokens,
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
