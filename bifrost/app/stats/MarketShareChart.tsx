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
import { CHART_COLOR_PALETTE, CHART_COLORS } from "@/lib/chartColors";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokens, formatTooltipDate } from "@/utils/formatters";
import {
  calculateProjection,
  calculateTimeProgress,
  shouldShowProjection,
} from "@/utils/projectionUtils";

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
  timeframe?: "24h" | "7d" | "30d" | "3m" | "1y";
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
  showProjection?: boolean;
  projectedTokens?: Record<string, number>;
}

function CustomTooltip({
  active,
  payload,
  chartConfig,
  rawData,
  showProjection,
  projectedTokens,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const rawTime = payload[0]?.payload?.rawTime as string | undefined;
  const isLastBar = payload[0]?.payload?.isLastBar as boolean | undefined;
  const originalPoint = rawData.find((p) => p.time === rawTime);
  const sortedPayload = [...payload]
    .filter((item) => item.value > 0 && !item.dataKey.endsWith("_projection"))
    .sort((a, b) => b.value - a.value);

  const hasProjections = isLastBar && showProjection && projectedTokens;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 min-w-[220px]">
      <div className="mb-3">
        <span className="text-sm font-medium text-foreground">
          {rawTime ? formatTooltipDate(rawTime) : ""}
        </span>
        {hasProjections && (
          <span className="ml-2 text-xs text-gray-400">(projected)</span>
        )}
      </div>
      <div className="space-y-2">
        {sortedPayload.map((item) => {
          const authorKey = item.dataKey; // Authors use dataKey directly without sanitization
          const author = chartConfig[authorKey]?.label || authorKey;
          const originalAuthor = originalPoint?.authors.find(
            (a) => a.author === authorKey
          );
          const tokens = originalAuthor?.totalTokens ?? 0;
          const percentage = item.value;
          const projectedAddition = hasProjections ? (projectedTokens[authorKey] ?? 0) : 0;

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
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
                  {formatTokens(tokens)} ({percentage.toFixed(1)}%)
                </span>
                {projectedAddition > 0 && (
                  <span className="text-xs tabular-nums text-gray-400">
                    → {formatTokens(tokens + projectedAddition)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketShareChart({ data, isLoading, timeframe = "1y" }: MarketShareChartProps) {
  const { chartData, authors, chartConfig, showProjection, projectedTokens } = useMemo(() => {
    const authorSet = new Set<string>();
    data.forEach((point) => {
      point.authors.forEach((a) => authorSet.add(a.author));
    });
    const authors = Array.from(authorSet);

    // Calculate time progress for the last data point
    const lastTimestamp = data.length > 0 ? data[data.length - 1].time : "";
    const timeProgress = lastTimestamp
      ? calculateTimeProgress(lastTimestamp, timeframe)
      : 0;
    const showProjection = shouldShowProjection(data.length, timeProgress);

    // Calculate projected token additions for each author
    const projectedTokens: Record<string, number> = {};
    if (showProjection) {
      authors.forEach((author) => {
        const authorTokenValues = data.map((p) => {
          const a = p.authors.find((a) => a.author === author);
          return a?.totalTokens ?? 0;
        });
        projectedTokens[author] = calculateProjection(authorTokenValues, timeProgress);
      });
    }

    const chartData = data.map((point, index) => {
      const entry: Record<string, string | number | boolean> = {
        time: formatTimeLabel(point.time),
        rawTime: point.time,
        isLastBar: index === data.length - 1,
      };

      const totalPercentage = point.authors.reduce(
        (sum, a) => sum + a.percentage,
        0
      );

      // For the last bar with projections, calculate projected percentages
      const isLastBar = index === data.length - 1;
      let totalProjectedTokens = 0;
      if (isLastBar && showProjection) {
        // Calculate total projected tokens for the last bar
        const currentTotal = point.authors.reduce((sum, a) => sum + a.totalTokens, 0);
        const projectedAdditions = Object.values(projectedTokens).reduce((sum, v) => sum + v, 0);
        totalProjectedTokens = currentTotal + projectedAdditions;
      }

      authors.forEach((author) => {
        const found = point.authors.find((a) => a.author === author);
        const rawPercentage = found?.percentage ?? 0;
        const normalizedPercentage =
          totalPercentage > 0 ? (rawPercentage / totalPercentage) * 100 : 0;
        entry[author] = normalizedPercentage;

        // Add projection percentage for the last bar
        // The projection shows what additional % each author would have
        if (isLastBar && showProjection && totalProjectedTokens > 0) {
          const projectedAddition = projectedTokens[author] ?? 0;
          // Convert token projection to percentage of total projected tokens
          const projectedPercentageAddition = (projectedAddition / totalProjectedTokens) * 100;
          entry[`${author}_projection`] = projectedPercentageAddition;
        } else {
          entry[`${author}_projection`] = 0;
        }
      });
      return entry;
    });

    const chartConfig: ChartConfig = {};
    authors.forEach((author, index) => {
      chartConfig[author] = {
        label: author,
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      };
      chartConfig[`${author}_projection`] = {
        label: `${author} (projected)`,
        color: CHART_COLORS.projection,
      };
    });

    return { chartData, authors, chartConfig, showProjection, projectedTokens };
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
            tickFormatter={(value) => `${Math.round(value)}%`}
            width={50}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            domain={[0, 100]}
            allowDataOverflow={true}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
            content={
              <CustomTooltip
                chartConfig={chartConfig}
                rawData={data}
                showProjection={showProjection}
                projectedTokens={projectedTokens}
              />
            }
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
          {/* Projection bars - stacked on top of actual data */}
          {showProjection &&
            authors.map((author) => (
              <Bar
                key={`${author}_projection`}
                dataKey={`${author}_projection`}
                stackId="a"
                fill={CHART_COLORS.projection}
                radius={0}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
