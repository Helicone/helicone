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
import {
  formatTokens,
  formatTimeLabel,
  formatTooltipDate,
} from "@/utils/formatters";
import {
  calculateProjection,
  calculateTimeProgress,
} from "@/utils/projectionUtils";

export interface UsageChartItem {
  name: string;
  totalTokens: number;
}

export interface UsageChartDataPoint {
  time: string;
  items: UsageChartItem[];
}

interface UsageChartProps {
  data: UsageChartDataPoint[];
  isLoading: boolean;
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y";
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
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
  const isLastBar = payload[0]?.payload?.isLastBar as boolean | undefined;

  const itemValues: Record<string, { actual: number; projection: number; fill: string }> = {};

  payload.forEach((item) => {
    if (item.value === 0) return;

    const isProjection = item.dataKey.endsWith("_projection");
    const baseKey = isProjection ? item.dataKey.replace("_projection", "") : item.dataKey;

    if (!itemValues[baseKey]) {
      itemValues[baseKey] = { actual: 0, projection: 0, fill: "" };
    }

    if (isProjection) {
      itemValues[baseKey].projection = item.value;
    } else {
      itemValues[baseKey].actual = item.value;
      itemValues[baseKey].fill = item.fill;
    }
  });

  const sortedEntries = Object.entries(itemValues)
    .filter(([, values]) => values.actual > 0 || values.projection > 0)
    .sort((a, b) => (b[1].actual + b[1].projection) - (a[1].actual + a[1].projection));

  const totalActual = sortedEntries.reduce((sum, [, values]) => sum + values.actual, 0);
  const totalProjection = sortedEntries.reduce((sum, [, values]) => sum + values.projection, 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 min-w-[220px]">
      <div className="mb-3">
        <span className="text-sm font-medium text-foreground">
          {rawTime ? formatTooltipDate(rawTime) : ""}
        </span>
        {isLastBar && totalProjection > 0 && (
          <span className="ml-2 text-xs text-gray-400">(projected)</span>
        )}
      </div>
      <div className="space-y-2">
        {sortedEntries.map(([key, values]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 rounded-sm"
                style={{ backgroundColor: values.fill }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {chartConfig[key]?.label || key}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
                {formatTokens(values.actual)}
              </span>
              {values.projection > 0 && (
                <span className="text-xs tabular-nums text-gray-400">
                  → {formatTokens(values.actual + values.projection)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-2 flex justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {formatTokens(totalActual)}
          </span>
          {totalProjection > 0 && (
            <span className="text-xs tabular-nums text-gray-400">
              → {formatTokens(totalActual + totalProjection)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function UsageChart({
  data,
  isLoading,
  timeframe,
}: UsageChartProps) {
  const { chartData, items, chartConfig } = useMemo(() => {
    const itemSet = new Set<string>();
    data.forEach((point) => {
      point.items.forEach((item) => itemSet.add(item.name));
    });
    const items = Array.from(itemSet);

    const lastTimestamp = data.length > 0 ? data[data.length - 1].time : "";
    const timeProgress = lastTimestamp
      ? calculateTimeProgress(lastTimestamp, timeframe)
      : 0;

    const chartData = data.map((point, index) => {
      const entry: Record<string, string | number | boolean> = {
        time: formatTimeLabel(point.time, timeframe),
        rawTime: point.time,
        isLastBar: index === data.length - 1,
      };
      items.forEach((name) => {
        const found = point.items.find((item) => item.name === name);
        const value = found?.totalTokens ?? 0;
        entry[sanitizeName(name)] = value;

        if (index === data.length - 1) {
          const itemValues = data.map((p) => {
            const item = p.items.find((i) => i.name === name);
            return item?.totalTokens ?? 0;
          });
          const projectionAddition = calculateProjection(itemValues, timeProgress);
          entry[`${sanitizeName(name)}_projection`] = projectionAddition;
        } else {
          entry[`${sanitizeName(name)}_projection`] = 0;
        }
      });
      return entry;
    });

    const chartConfig: ChartConfig = {};
    items.forEach((name, index) => {
      chartConfig[sanitizeName(name)] = {
        label: name,
        color: CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length],
      };
      chartConfig[`${sanitizeName(name)}_projection`] = {
        label: `${name} (projected)`,
        color: CHART_COLORS.projection,
      };
    });

    return { chartData, items, chartConfig };
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
          {items.map((name, index) => (
            <Bar
              key={name}
              dataKey={sanitizeName(name)}
              stackId="a"
              fill={CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]}
              radius={0}
            />
          ))}
          {items.map((name) => (
            <Bar
              key={`${name}_projection`}
              dataKey={`${sanitizeName(name)}_projection`}
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
