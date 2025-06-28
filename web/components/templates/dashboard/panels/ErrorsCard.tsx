import { formatLargeNumber } from "@/components/shared/utils/numberFormat";
import StatsCard from "./StatsCard";
import { CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

interface ErrorsCardProps {
  data: {
    name: string;
    value: number;
  }[];
  totalErrors: number;
  errorPercentage: number;
  isLoading: boolean;
}

export default function ErrorsCard({
  data,
  totalErrors,
  errorPercentage,
  isLoading,
}: ErrorsCardProps) {
  const chartConfig = useMemo(() => {
    if (!data || data.length === 0) return {};
    const config = Object.fromEntries([
      ...data.map((d, i) => [
        `error-${d.name.toLowerCase().replace(" ", "-")}`,
        { label: d.name, color: `oklch(var(--chart-${(i % 10) + 1}))` },
      ]),
      ["label", { color: "hsl(var(--foreground))" }],
      ["value", { label: "Error %" }],
    ]) satisfies ChartConfig;
    return config;
  }, [data]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

  // listen to resize of the chart container
  useEffect(() => {
    if (chartContainerRef.current) {
      setChartContainerWidth(chartContainerRef.current?.clientWidth ?? 0);
      const resizeObserver = new ResizeObserver((entries) => {
        setChartContainerWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(chartContainerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [chartContainerRef]);

  return (
    <StatsCard
      title="All Errors"
      isLoading={isLoading}
      value={
        <CardTitle className="flex flex-row items-end gap-2">
          <span className="tabular-nums">{formatLargeNumber(totalErrors)}</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({errorPercentage.toFixed(2)}% of all requests)
          </span>{" "}
        </CardTitle>
      }
    >
      <ChartContainer
        ref={chartContainerRef}
        config={chartConfig}
        className="h-full w-full"
      >
        <BarChart
          layout="vertical"
          margin={{ right: 50 }}
          data={
            data && data.length > 0
              ? data.map((d, i) => ({
                  errorName: `error-${d.name.toLowerCase().replace(" ", "-")}`,
                  value: (d.value / totalErrors) * 100,
                  fill: `var(--color-error-${d.name
                    .toLowerCase()
                    .replace(" ", "-")})`,
                }))
              : []
          }
        >
          {/* <CartesianGrid /> */}
          <YAxis
            dataKey="errorName"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => {
              return (
                chartConfig[value as keyof typeof chartConfig]?.label ?? value
              );
            }}
            hide
          />
          <XAxis dataKey="value" type="number" hide />
          <ChartTooltip
            content={<ChartTooltipContent cursor={false} hideLabel />}
          />
          <Bar dataKey="value" layout="vertical" radius={4} maxBarSize={30}>
            <LabelList
              formatter={(value: string) => {
                return (
                  chartConfig[value as keyof typeof chartConfig]?.label ??
                  value.replace("error-", "").replace(/-/g, " ")
                );
              }}
              dataKey="errorName"
              position="insideLeft"
              offset={8}
              className="fill-[--color-label]"
              fontSize={12}
            />
            <LabelList
              formatter={(value: number) => {
                return `${value.toFixed(1)}%`;
              }}
              dataKey="value"
              position={{
                x:
                  chartContainerWidth || chartContainerRef.current?.clientWidth,
                y: 18,
              }}
              offset={8}
              className="fill-[--color-label]"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </StatsCard>
  );
}
