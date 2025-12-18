"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { CHART_COLOR_PALETTE } from "@/lib/chartColors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatTokens,
  formatTimeLabel,
  formatTooltipDate,
} from "@/utils/formatters";

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

function sanitizeProviderName(provider: string): string {
  return provider.replace(/[^a-zA-Z0-9]/g, "_");
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    fill: string;
    payload: Record<string, unknown>;
  }>;
  chartConfig: ChartConfig;
}

function CustomTooltip({ active, payload, chartConfig }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const rawTime = payload[0]?.payload?.rawTime as string | undefined;
  const sortedPayload = [...payload]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = sortedPayload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 min-w-[220px]">
      <div className="mb-3">
        <span className="text-sm font-medium text-foreground">
          {rawTime ? formatTooltipDate(rawTime) : ""}
        </span>
      </div>
      <div className="space-y-2">
        {sortedPayload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {chartConfig[item.dataKey]?.label || item.dataKey}
              </span>
            </div>
            <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
              {formatTokens(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-2 flex justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
          {formatTokens(total)}
        </span>
      </div>
    </div>
  );
}

export function ProviderUsageChart({
  data,
  isLoading,
  timeframe,
}: ProviderUsageChartProps) {
  const { chartData, providers, chartConfig } = useMemo(() => {
    const providerSet = new Set<string>();
    data.forEach((point) => {
      point.providers.forEach((p) => providerSet.add(p.provider));
    });
    const providers = Array.from(providerSet);

    const chartData = data.map((point) => {
      const entry: Record<string, string | number> = {
        time: formatTimeLabel(point.time, timeframe),
        rawTime: point.time,
      };
      providers.forEach((provider) => {
        const found = point.providers.find((p) => p.provider === provider);
        entry[sanitizeProviderName(provider)] = found?.totalTokens ?? 0;
      });
      return entry;
    });

    const chartConfig: ChartConfig = {};
    providers.forEach((provider, index) => {
      chartConfig[sanitizeProviderName(provider)] = {
        label: provider,
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      };
    });

    return { chartData, providers, chartConfig };
  }, [data, timeframe]);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-gray-500 dark:text-gray-400">
        No data available for this time period
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={1} barCategoryGap="8%">
          <CartesianGrid
            vertical={false}
            stroke="#e5e7eb"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={50}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTokens}
            width={50}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
            content={<CustomTooltip chartConfig={chartConfig} />}
          />
          {providers.map((provider, index) => (
            <Bar
              key={provider}
              dataKey={sanitizeProviderName(provider)}
              stackId="a"
              fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              radius={0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
