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
import { ChartContainer } from "@/components/ui/chart";
import { CHART_COLORS } from "@/lib/chartColors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatTokens,
  formatTimeLabel,
  formatTooltipDate,
} from "@/utils/formatters";
import {
  calculateProjection,
  calculateTimeProgress,
} from "@/utils/projectionUtils";

export interface SingleUsageDataPoint {
  time: string;
  totalTokens: number;
}

interface SingleUsageChartProps {
  data: SingleUsageDataPoint[];
  isLoading: boolean;
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y";
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: Record<string, unknown>;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const rawTime = payload[0]?.payload?.rawTime as string | undefined;
  const isLastBar = payload[0]?.payload?.isLastBar as boolean | undefined;
  const actual = (payload[0]?.payload?.tokens as number) || 0;
  const projection = (payload[0]?.payload?.projection as number) || 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 min-w-[180px]">
      <div className="mb-2">
        <span className="text-sm font-medium text-foreground">
          {rawTime ? formatTooltipDate(rawTime) : ""}
        </span>
        {isLastBar && projection > 0 && (
          <span className="ml-2 text-xs text-gray-400">(projected)</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">Tokens</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {formatTokens(actual)}
          </span>
          {projection > 0 && (
            <span className="text-xs tabular-nums text-gray-400">
              → {formatTokens(actual + projection)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SingleUsageChart({
  data,
  isLoading,
  timeframe,
  height = 200,
}: SingleUsageChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    const lastTimestamp = data[data.length - 1].time;
    const timeProgress = calculateTimeProgress(lastTimestamp, timeframe);

    return data.map((point, index) => {
      const isLastBar = index === data.length - 1;
      let projection = 0;

      if (isLastBar) {
        const values = data.map((p) => p.totalTokens);
        projection = calculateProjection(values, timeProgress);
      }

      return {
        time: formatTimeLabel(point.time, timeframe),
        rawTime: point.time,
        tokens: point.totalTokens,
        projection,
        isLastBar,
      };
    });
  }, [data, timeframe]);

  if (isLoading) {
    return <Skeleton className={`h-[${height}px] w-full`} />;
  }

  if (!data?.length) {
    return (
      <div className={`flex h-[${height}px] items-center justify-center text-gray-500 dark:text-gray-400`}>
        No usage data available
      </div>
    );
  }

  const chartConfig = {
    tokens: {
      label: "Tokens",
      color: CHART_COLORS.blue,
    },
    projection: {
      label: "Projected",
      color: CHART_COLORS.projection,
    },
  };

  return (
    <ChartContainer config={chartConfig} className={`h-[${height}px] w-full`}>
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
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="tokens"
            stackId="a"
            fill={CHART_COLORS.blue}
            radius={0}
          />
          <Bar
            dataKey="projection"
            stackId="a"
            fill={CHART_COLORS.projection}
            radius={0}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
