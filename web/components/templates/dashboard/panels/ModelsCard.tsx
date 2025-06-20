import { useEffect, useMemo, useRef, useState } from "react";
import StatsCard from "./StatsCard";
import { ChartConfig } from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Bar } from "recharts";

interface Model {
  name: string;
  value: number;
}

export default function ModelsCard({
  isLoading,
  models,
}: {
  isLoading: boolean;
  models: Model[];
}) {
  const chartConfig = useMemo(() => {
    if (!models || models.length === 0) return {};
    const config = Object.fromEntries([
      ...models.map((d, i) => [
        d.name,
        { label: d.name, color: `oklch(var(--chart-${(i % 10) + 1}))` },
      ]),
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
    <StatsCard title="Top Models" isLoading={isLoading}>
      <ChartContainer
        ref={chartContainerRef}
        config={chartConfig}
        className="h-full w-full"
      >
        <BarChart
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
          <Bar dataKey="value" layout="vertical" radius={4} maxBarSize={30}>
            <LabelList
              formatter={(value: string) => {
                return (
                  chartConfig[value as keyof typeof chartConfig]?.label ?? value
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
              position={{
                x: chartContainerWidth,
                y: 18,
              }}
              offset={8}
              className="fill-[--color-label] "
              fontSize={12}
              textAnchor="end"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </StatsCard>
  );
}
