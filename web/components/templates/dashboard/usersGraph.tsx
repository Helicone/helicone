import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import { UsersOverTime } from "@/lib/api/metrics/getUsersOverTime";
import { getTimeMap } from "@/lib/timeCalculations/constants";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import StyledAreaChart from "./styledAreaChart";
import { ChartConfig } from "@/components/ui/chart";
import { ChartTooltipContent } from "@/components/ui/chart";
import { ChartTooltip } from "@/components/ui/chart";
import { useMemo } from "react";
import { Bar } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart } from "recharts";
import { XAxis } from "recharts";
import { CartesianGrid } from "recharts";

const chartConfig = {
  users: {
    label: "Users",
    color: "oklch(var(--chart-9))",
  },
} satisfies ChartConfig;

export const UsersGraph = ({
  metricsData,
  isLoading,
  overTimeData,
  timeIncrement,
}: {
  metricsData: number;
  isLoading: boolean;
  overTimeData: UsersOverTime[];
  timeIncrement: TimeIncrement;
}) => {
  const chartData = useMemo(
    () =>
      overTimeData.map((r) => ({
        date: getTimeMap(timeIncrement)(r.time),
        users: r.count,
      })) ?? [],
    [overTimeData, timeIncrement]
  );
  return (
    <StyledAreaChart
      title={"Users"}
      value={metricsData ? formatLargeNumber(metricsData) : "0"}
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
          <Bar dataKey="users" fill="var(--color-users)" />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
        </BarChart>
      </ChartContainer>
    </StyledAreaChart>
  );
};
