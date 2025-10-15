import React from "react";
import { VisualizationConfig } from "./ChartConfigModal";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartViewProps {
  data: Record<string, any>[];
  config: VisualizationConfig;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ChartView({ data, config }: ChartViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
        No data available for chart visualization
      </div>
    );
  }

  // Build chart config for theming
  const chartConfig: Record<string, { label: string; color?: string }> = {};
  config.yAxis.forEach((yKey, index) => {
    chartConfig[yKey] = {
      label: yKey,
      color: config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const commonAxisProps = {
      xAxis: (
        <XAxis
          dataKey={config.xAxis}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={config.xAxisLabel ? { value: config.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
        />
      ),
      yAxis: (
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          label={config.yAxisLabel ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
      ),
      grid: <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />,
    };

    const legendProps = config.legendPosition && config.legendPosition !== "hidden"
      ? { verticalAlign: config.legendPosition === "top" || config.legendPosition === "bottom" ? config.legendPosition : "middle" as const,
          align: config.legendPosition === "left" || config.legendPosition === "right" ? config.legendPosition : "center" as const }
      : undefined;

    switch (config.type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {legendProps && <ChartLegend content={<ChartLegendContent />} {...legendProps} />}
            {config.yAxis.map((yKey, index) => (
              <Line
                key={yKey}
                type="monotone"
                dataKey={yKey}
                stroke={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {legendProps && <ChartLegend content={<ChartLegendContent />} {...legendProps} />}
            {config.yAxis.map((yKey, index) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {legendProps && <ChartLegend content={<ChartLegendContent />} {...legendProps} />}
            {config.yAxis.map((yKey, index) => (
              <Area
                key={yKey}
                type="monotone"
                dataKey={yKey}
                stroke={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart {...commonProps}>
            <ChartTooltip content={<ChartTooltipContent />} />
            {legendProps && <Legend {...legendProps} />}
            <Pie
              data={data}
              dataKey={config.yAxis[0] || "value"}
              nameKey={config.xAxis}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={config.colors?.[index % config.colors.length] || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            {commonAxisProps.grid}
            {commonAxisProps.xAxis}
            {commonAxisProps.yAxis}
            <ChartTooltip content={<ChartTooltipContent />} />
            {legendProps && <ChartLegend content={<ChartLegendContent />} {...legendProps} />}
            {config.yAxis.map((yKey, index) => (
              <Scatter
                key={yKey}
                name={yKey}
                data={data}
                fill={config.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full p-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
