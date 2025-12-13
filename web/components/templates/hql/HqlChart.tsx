import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartConfigState } from "./ChartConfig";

interface HqlChartProps {
  data: Record<string, any>[];
  config: ChartConfigState;
}

// Chart colors - vibrant colors that work well for data visualization
const CHART_COLORS = [
  "#0EA5E9", // sky-500
  "#8B5CF6", // violet-500
  "#F97316", // orange-500
  "#10B981", // emerald-500
  "#EC4899", // pink-500
  "#6366F1", // indigo-500
  "#14B8A6", // teal-500
  "#F59E0B", // amber-500
];

// Get more colors by cycling through with different opacity
function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// Transform data to ensure numeric values
function prepareChartData(
  data: Record<string, any>[],
  config: ChartConfigState
): Record<string, any>[] {
  return data.map((row) => {
    const transformed: Record<string, any> = {
      [config.xAxis]: row[config.xAxis],
    };

    // Convert Y-axis values to numbers
    for (const yCol of config.yAxis) {
      const value = row[yCol];
      transformed[yCol] =
        typeof value === "number" ? value : Number(value) || 0;
    }

    return transformed;
  });
}

// Prepare data for pie chart (aggregate by X-axis)
function preparePieData(
  data: Record<string, any>[],
  config: ChartConfigState
): { name: string; value: number }[] {
  const aggregated = new Map<string, number>();
  const yCol = config.yAxis[0];

  for (const row of data) {
    const name = String(row[config.xAxis] ?? "Unknown");
    const value =
      typeof row[yCol] === "number" ? row[yCol] : Number(row[yCol]) || 0;
    aggregated.set(name, (aggregated.get(name) || 0) + value);
  }

  return Array.from(aggregated.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Limit to top 10 for readability
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
}

// Format large numbers
function formatValue(value: number): string {
  if (typeof value !== "number") return String(value);
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}

// Format axis tick
function formatAxisTick(value: any): string {
  if (typeof value === "number") return formatValue(value);
  if (typeof value === "string" && value.length > 15) {
    return value.substring(0, 12) + "...";
  }
  return String(value);
}

export function HqlChart({ data, config }: HqlChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  const chartData = prepareChartData(data, config);

  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const renderChart = () => {
    switch (config.chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={config.xAxis}
              tick={{ fontSize: 11 }}
              tickFormatter={formatAxisTick}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={formatValue}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {config.yAxis.map((yCol, index) => (
              <Bar
                key={yCol}
                dataKey={yCol}
                fill={getColor(index)}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={config.xAxis}
              tick={{ fontSize: 11 }}
              tickFormatter={formatAxisTick}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={formatValue}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {config.yAxis.map((yCol, index) => (
              <Line
                key={yCol}
                type="monotone"
                dataKey={yCol}
                stroke={getColor(index)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={config.xAxis}
              tick={{ fontSize: 11 }}
              tickFormatter={formatAxisTick}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={formatValue}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {config.yAxis.map((yCol, index) => (
              <Area
                key={yCol}
                type="monotone"
                dataKey={yCol}
                stroke={getColor(index)}
                fill={getColor(index)}
                fillOpacity={0.3}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        );

      case "pie": {
        const pieData = preparePieData(data, config);
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={150}
              dataKey="value"
              isAnimationActive={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatValue(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        );
      }

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={config.xAxis}
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={formatValue}
              name={config.xAxis}
              className="text-muted-foreground"
            />
            <YAxis
              dataKey={config.yAxis[0]}
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={formatValue}
              name={config.yAxis[0]}
              className="text-muted-foreground"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<CustomTooltip />}
            />
            <Legend />
            <Scatter
              name={`${config.xAxis} vs ${config.yAxis[0]}`}
              data={chartData}
              fill={getColor(0)}
              isAnimationActive={false}
            />
          </ScatterChart>
        );

      default:
        return (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Unsupported chart type
          </div>
        );
    }
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default HqlChart;
