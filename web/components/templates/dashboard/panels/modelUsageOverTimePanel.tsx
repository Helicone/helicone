import { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CHART_COLOR_PALETTE } from "../../../../lib/chartColors";
import { formatLargeNumber } from "../../../shared/utils/numberFormat";
import LoadingAnimation from "../../../shared/loadingAnimation";
import StyledAreaChart from "../styledAreaChart";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import { TimeIncrement } from "../../../../lib/timeCalculations/fetchTimeData";

interface ModelUsageOverTimePanelProps {
  data:
    | {
        data:
          | {
              model: string;
              request_count: number;
              total_tokens: number;
              time: Date;
            }[]
          | null;
        error: string | null;
      }
    | undefined;
  isLoading: boolean;
  timeIncrement: TimeIncrement;
}

const ModelUsageOverTimePanel = ({
  data,
  isLoading,
  timeIncrement,
}: ModelUsageOverTimePanelProps) => {
  // Pivot data: group by time, with each model as a column
  const { chartData, models, chartConfig } = useMemo(() => {
    if (!data?.data) return { chartData: [], models: [], chartConfig: {} };

    // Get top models by total requests
    const modelTotals = new Map<string, number>();
    for (const d of data.data) {
      modelTotals.set(
        d.model,
        (modelTotals.get(d.model) ?? 0) + d.request_count
      );
    }
    const topModels = Array.from(modelTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([model]) => model);

    // Pivot: group by time
    const timeMap = new Map<string, Record<string, number>>();
    for (const d of data.data) {
      const timeKey = getTimeMap(timeIncrement)(d.time);
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { date: timeKey as any });
      }
      const row = timeMap.get(timeKey)!;
      if (topModels.includes(d.model)) {
        row[d.model] = (row[d.model] ?? 0) + d.request_count;
      } else {
        row["other"] = (row["other"] ?? 0) + d.request_count;
      }
    }

    const allModels = topModels.length > 0 ? topModels : [];
    // Add "other" if there are models beyond top 8
    const hasOther = Array.from(timeMap.values()).some((row) => (row["other"] ?? 0) > 0);
    if (hasOther) allModels.push("other");

    // Use safe keys for chart data (model names may have dots/slashes)
    const modelKeys = allModels.map((_, i) => `model_${i}`);
    const config: Record<string, { label: string; color: string }> = {};
    modelKeys.forEach((key, i) => {
      config[key] = {
        label: allModels[i] === "other" ? "Other" : allModels[i],
        color: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length],
      };
    });

    // Remap chart data to use safe keys
    const safeChartData = Array.from(timeMap.values()).map((row) => {
      const safeRow: Record<string, any> = { date: (row as any).date };
      allModels.forEach((model, i) => {
        if (row[model] !== undefined) {
          safeRow[`model_${i}`] = row[model];
        }
      });
      return safeRow;
    });

    return {
      chartData: safeChartData,
      models: modelKeys,
      chartConfig: config,
    };
  }, [data, timeIncrement]);

  return (
    <StyledAreaChart
      title="Model Usage Over Time"
      value={undefined}
      isDataOverTimeLoading={isLoading}
      withAnimation={true}
    >
      <div className="w-full pt-2">
        {isLoading ? (
          <div className="flex h-[180px] w-full items-center justify-center bg-muted">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} tickLine={false} />
              <YAxis
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => formatLargeNumber(v)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `${new Intl.NumberFormat("us").format(Number(value))} requests`
                    }
                  />
                }
              />
              {models.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </StyledAreaChart>
  );
};

export default ModelUsageOverTimePanel;
