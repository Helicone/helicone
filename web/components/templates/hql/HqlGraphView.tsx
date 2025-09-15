import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { P, Muted, H3 } from "@/components/ui/typography";
// Simplified grid view does not use the recommendations side panel
import {
  analyzeHqlColumns,
  generateChartSuggestions,
  aggregateDataForChart,
  ChartSuggestion,
  HqlColumn,
} from "./utils/chartUtils";
 

export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "scatter"
  | "histogram"
  | "multi-line"
  | "area"
  | "stacked-bar";

interface HqlGraphViewProps {
  data: Array<Record<string, any>>;
  loading: boolean;
}

interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string | string[];
  aggregation?: "sum" | "avg" | "count" | "max" | "min";
  groupBy?: "hour" | "day" | "week" | "month";
  title: string;
}

const CHART_COLORS = [
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
];

export function HqlGraphView({ data, loading }: HqlGraphViewProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <P className="text-muted-foreground">Loading chart...</P>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <P className="text-muted-foreground">
          No data available for visualization
        </P>
      </div>
    );
  }

  const columns = useMemo(() => analyzeHqlColumns(data), [data]);
  const suggestions = useMemo(
    () => generateChartSuggestions(columns),
    [columns],
  );
  // Grid view: no selection, we render multiple suggestions at once
  

  const numericColumns = columns.filter((c) => c.type === "numeric");
  const dateColumns = columns.filter((c) => c.type === "datetime");

  if (numericColumns.length === 0 && dateColumns.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <P className="text-muted-foreground">Cannot visualize data</P>
        <Muted className="text-center">
          This data contains only text columns. Graphs require at least one
          numeric or date column.
        </Muted>
      </div>
    );
  }

  // Prepare a list of supported suggestions to render in a grid
  const supportedTypes: ChartType[] = [
    "line",
    "bar",
    "pie",
    "scatter",
    "histogram",
    "multi-line",
    "area",
  ];
  const gridSuggestions = useMemo(
    () =>
      suggestions
        .filter((s) => supportedTypes.includes(s.type as ChartType))
        .slice(0, 6),
    [suggestions],
  );

  

  // Helper: split y-axis for multi-line suggestions
  function getYColumnsForSuggestion(s: ChartSuggestion): string[] {
    if (s.type === "multi-line") {
      return s.yAxis.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [s.yAxis];
  }

  // Helper: produce aggregated data for a suggestion
  function getProcessedDataForSuggestion(s: ChartSuggestion): Array<Record<string, any>> {
    const yCols = getYColumnsForSuggestion(s);
    if (s.type === "multi-line") {
      // Aggregate each series then merge on x-axis key
      const seriesList = yCols.map((y) =>
        aggregateDataForChart(data, s.xAxis, y, s.aggregation),
      );
      // Build index by x key
      const index: Record<string, Record<string, any>> = {};
      for (let i = 0; i < seriesList.length; i++) {
        for (const row of seriesList[i]) {
          const xVal = row[s.xAxis];
          if (!index[xVal]) index[xVal] = { [s.xAxis]: xVal };
          index[xVal][yCols[i]] = row[yCols[i]];
        }
      }
      return Object.values(index).sort((a, b) => String(a[s.xAxis]).localeCompare(String(b[s.xAxis])));
    }
    if (s.type === "pie" || s.type === "scatter" || s.type === "histogram") {
      // Use raw data; renderer computes its own shape
      return data;
    }
    return aggregateDataForChart(data, s.xAxis, yCols[0], s.aggregation);
  }

  function buildChartConfig(yCols: string[]) {
    const config: any = {};
    yCols.forEach((col, index) => {
      config[col] = {
        label: col,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {gridSuggestions.map((s, idx) => {
          const yCols = getYColumnsForSuggestion(s);
          const cfg = {
            type: s.type as ChartType,
            xAxis: s.xAxis,
            yAxis: yCols.length === 1 ? yCols[0] : yCols,
            aggregation: s.aggregation,
            title: s.title,
          } as ChartConfig;
          const processed = getProcessedDataForSuggestion(s);
          const containerConfig = buildChartConfig(yCols);
          return (
            <div key={`${s.title}-${idx}`} className="space-y-3">
              <div className="flex items-center justify-between">
                <H3>{s.title}</H3>
                <Badge variant="outline" className="text-xs capitalize">
                  {s.type.replace("-", " ")}
                </Badge>
              </div>
              <div className="h-72 w-full overflow-hidden rounded-lg border border-border bg-card p-4">
                <ChartContainer className="h-full w-full" config={containerConfig}>
                  {renderEnhancedChart(cfg, processed, columns)}
                </ChartContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom chart builder removed

function renderEnhancedChart(
  config: ChartConfig,
  data: Array<Record<string, any>>,
  columns: HqlColumn[],
) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <P className="text-muted-foreground">No data to display</P>
      </div>
    );
  }

  const yColumns = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];

  switch (config.type) {
    case "line":
      return (
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const column = columns.find((c) => c.name === config.xAxis);
              if (column?.type === "datetime") {
                return new Date(value).toLocaleDateString();
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey={yColumns[0]}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[0], strokeWidth: 2 }}
          />
        </LineChart>
      );

    case "multi-line":
      return (
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const column = columns.find((c) => c.name === config.xAxis);
              if (column?.type === "datetime") {
                return new Date(value).toLocaleDateString();
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          {yColumns.map((col, index) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{
                fill: CHART_COLORS[index % CHART_COLORS.length],
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      );

    case "area":
      return (
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const column = columns.find((c) => c.name === config.xAxis);
              if (column?.type === "datetime") {
                return new Date(value).toLocaleDateString();
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey={yColumns[0]}
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
            fillOpacity={0.3}
          />
        </AreaChart>
      );

    case "bar":
      return (
        <BarChart data={data.slice(0, 20)} margin={{ top: 8, right: 16, bottom: 48, left: 16 }}>
          {" "}
          {/* Limit bars for readability */}
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            angle={data.length > 10 ? -45 : 0}
            textAnchor={data.length > 10 ? "end" : "middle"}
            height={data.length > 10 ? 80 : 40}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey={yColumns[0]}
            fill={CHART_COLORS[0]}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      );

    case "pie":
      const pieData = processDataForPieChart(data, config.xAxis);
      return (
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={110}
            fill={CHART_COLORS[0]}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </PieChart>
      );

    case "scatter":
      return (
        <ScatterChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <XAxis dataKey={config.xAxis} type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey={yColumns[0]} type="number" tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Scatter fill={CHART_COLORS[0]} />
        </ScatterChart>
      );

    case "histogram":
      const histogramData = createHistogramData(data, config.xAxis);
      return (
        <BarChart data={histogramData} margin={{ top: 8, right: 16, bottom: 64, left: 16 }}>
          <XAxis
            dataKey="range"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[2, 2, 0, 0]} />
        </BarChart>
      );

    default:
      return (
        <div className="flex h-full items-center justify-center">
          <P className="text-muted-foreground">
            Unsupported chart type: {config.type}
          </P>
        </div>
      );
  }
}

function processDataForPieChart(
  data: Array<Record<string, any>>,
  xColumn: string,
): Array<{ name: string; value: number }> {
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    const value = String(row[xColumn]);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Limit to top 10 for readability
}

function createHistogramData(
  data: Array<Record<string, any>>,
  column: string,
): Array<{ range: string; count: number }> {
  const values = data
    .map((row) => Number(row[column]))
    .filter((val) => !isNaN(val) && isFinite(val));
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = Math.min(15, Math.max(5, Math.sqrt(values.length))); // Dynamic bin count
  const binSize = (max - min) / bins;

  const histogram: Array<{ range: string; count: number }> = [];

  for (let i = 0; i < bins; i++) {
    const lower = min + i * binSize;
    const upper = min + (i + 1) * binSize;
    const count = values.filter(
      (val) => val >= lower && (i === bins - 1 ? val <= upper : val < upper),
    ).length;

    // Format ranges based on the data scale
    const formatValue = (val: number) => {
      if (val < 0.01) return val.toExponential(2);
      if (val < 1) return val.toFixed(3);
      if (val < 100) return val.toFixed(1);
      return val.toFixed(0);
    };

    histogram.push({
      range: `${formatValue(lower)} - ${formatValue(upper)}`,
      count,
    });
  }

  return histogram.filter((h) => h.count > 0); // Remove empty bins
}
