import { useEffect, useMemo, useRef, useState } from "react";
import StatsCard from "./StatsCard";
import {
  ChartConfig,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Bar } from "recharts";
import { CardTitle } from "@/components/ui/card";

interface Model {
  name: string;
  value: number;
}

export default function ModelsCard({
  isLoading,
  models,
  totalModels,
  isRefetching,
}: {
  isLoading: boolean;
  models: Model[];
  totalModels: number;
  isRefetching: boolean;
}) {
  const chartConfig = useMemo(() => {
    if (!models || models.length === 0) return {};
    const config = Object.fromEntries([
      ...models.map((d, i) => [
        d.name,
        { label: d.name, color: `oklch(var(--chart-${(i % 10) + 1}))` },
      ]),
      ["value", { label: "Requests" }],
    ]) satisfies ChartConfig;
    return config;
  }, [models]);

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
      title={`Top Models`}
      value={
        <CardTitle className="flex flex-row items-end gap-2">
          <span className="tabular-nums">{totalModels}</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (total models)
          </span>{" "}
        </CardTitle>
      }
      isLoading={isLoading || isRefetching}
    >
      <div className="h-full overflow-y-auto">
        <ChartContainer
          className="w-full"
          ref={chartContainerRef}
          config={chartConfig}
        >
          <BarChart
            barSize={30}
            maxBarSize={30}
            layout="vertical"
            margin={{ left: 0, top: 0, bottom: 0, right: 20 }}
            data={
              models && models.length > 0
                ? models.map((d, i) => ({
                    modelName: d.name,
                    value: +d.value,
                    fill: `oklch(var(--chart-${(i % 10) + 1}))`,
                  }))
                : []
            }
          >
            {/* <CartesianGrid /> */}
            <YAxis
              dataKey="modelName"
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
            <Bar dataKey="value" layout="vertical" radius={4}>
              <LabelList
                formatter={(value: string) => {
                  return (
                    chartConfig[value as keyof typeof chartConfig]?.label ??
                    value
                  );
                }}
                dataKey="modelName"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                // position={{
                //   x:
                //     chartContainerWidth ||
                //     chartContainerRef.current?.clientWidth,
                //   y: 18,
                // }}
                position="right"
                offset={8}
                className="fill-[--color-label] "
                fontSize={12}
                textAnchor="end"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </StatsCard>
  );
}
