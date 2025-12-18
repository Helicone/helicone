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
import { formatTokens, formatTooltipDate } from "@/utils/formatters";

interface AuthorTokens {
  author: string;
  totalTokens: number;
  percentage: number;
}

interface TimeSeriesDataPoint {
  time: string;
  authors: AuthorTokens[];
}

interface MarketShareChartProps {
  data: TimeSeriesDataPoint[];
  isLoading: boolean;
}

function formatTimeLabel(time: string): string {
  const date = new Date(time);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
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
  rawData: TimeSeriesDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  chartConfig,
  rawData,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const rawTime = payload[0]?.payload?.rawTime as string | undefined;
  const originalPoint = rawData.find((p) => p.time === rawTime);
  const sortedPayload = [...payload]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 min-w-[220px]">
      <div className="mb-3">
        <span className="text-sm font-medium text-foreground">
          {rawTime ? formatTooltipDate(rawTime) : ""}
        </span>
      </div>
      <div className="space-y-2">
        {sortedPayload.map((item) => {
          const author = chartConfig[item.dataKey]?.label || item.dataKey;
          const originalAuthor = originalPoint?.authors.find(
            (a) => a.author === author
          );
          const tokens = originalAuthor?.totalTokens ?? 0;
          const percentage = item.value;

          return (
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
                  {author}
                </span>
              </div>
              <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
                {formatTokens(tokens)} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketShareChart({ data, isLoading }: MarketShareChartProps) {
  const { chartData, authors, chartConfig } = useMemo(() => {
    const authorSet = new Set<string>();
    data.forEach((point) => {
      point.authors.forEach((a) => authorSet.add(a.author));
    });
    const authors = Array.from(authorSet);

    const chartData = data.map((point) => {
      const entry: Record<string, string | number> = {
        time: formatTimeLabel(point.time),
        rawTime: point.time,
      };

      const totalPercentage = point.authors.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      authors.forEach((author) => {
        const found = point.authors.find((a) => a.author === author);
        const rawPercentage = found?.percentage ?? 0;
        const normalizedPercentage =
          totalPercentage > 0 ? (rawPercentage / totalPercentage) * 100 : 0;
        entry[author] = normalizedPercentage;
      });
      return entry;
    });

    const chartConfig: ChartConfig = {};
    authors.forEach((author, index) => {
      chartConfig[author] = {
        label: author,
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      };
    });

    return { chartData, authors, chartConfig };
  }, [data]);

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
            tickFormatter={(value) => `${Math.round(value)}%`}
            width={50}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            domain={[0, 100]}
            allowDataOverflow={true}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
            content={<CustomTooltip chartConfig={chartConfig} rawData={data} />}
          />
          {authors.map((author, index) => (
            <Bar
              key={author}
              dataKey={author}
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
