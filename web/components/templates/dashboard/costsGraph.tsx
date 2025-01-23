import { getTimeMap } from "@/lib/timeCalculations/constants";
import StyledAreaChart from "./styledAreaChart";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, XAxis } from "recharts";
import { CartesianGrid } from "recharts";
import { BarChart } from "recharts";
import { CostOverTime } from "@/pages/api/metrics/costOverTime";
import { useMemo } from "react";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";

export function formatNumberString(
  numString: string,
  minimumFractionDigits?: boolean
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}

const chartConfig = {
  costs: {
    label: "Costs",
    color: "oklch(var(--chart-6))",
  },
} satisfies ChartConfig;

export const CostsGraph = ({
  metricsData,
  isLoading,
  overTimeData,
  timeIncrement,
}: {
  metricsData: number;
  isLoading: boolean;
  overTimeData: CostOverTime[];
  timeIncrement: TimeIncrement;
}) => {
  const chartData = useMemo(
    () =>
      overTimeData.map((r) => ({
        date: getTimeMap(timeIncrement)(r.time),
        costs: r.cost,
      })) ?? [],
    [overTimeData, timeIncrement]
  );

  return (
    <StyledAreaChart
      title={"Costs"}
      value={
        metricsData
          ? `$${formatNumberString(
              metricsData < 0.02
                ? metricsData.toFixed(7)
                : metricsData.toFixed(2),
              true
            )}`
          : "$0.00"
      }
      isDataOverTimeLoading={isLoading}
    >
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <Bar dataKey="costs" fill="var(--color-costs)" />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent labelKey="date" indicator="dot" />}
          />
        </BarChart>
      </ChartContainer>
    </StyledAreaChart>
  );
};
