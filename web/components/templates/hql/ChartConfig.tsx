import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChartType = "bar" | "line" | "area" | "pie" | "scatter";

export interface ChartConfigState {
  chartType: ChartType;
  xAxis: string;
  yAxis: string[];
}

interface ChartConfigProps {
  columns: string[];
  data: Record<string, any>[];
  config: ChartConfigState | null;
  onConfigChange: (config: ChartConfigState | null) => void;
}

type ColumnType = "numeric" | "categorical" | "datetime";

function detectColumnType(
  rows: Record<string, any>[],
  column: string
): ColumnType {
  const sample = rows.slice(0, 20).map((r) => r[column]);
  const nonNullSample = sample.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );

  if (nonNullSample.length === 0) return "categorical";

  // Check if all values are numbers or can be parsed as numbers
  const allNumeric = nonNullSample.every((v) => {
    if (typeof v === "number") return true;
    if (typeof v === "string") {
      const parsed = Number(v);
      return !isNaN(parsed) && isFinite(parsed);
    }
    return false;
  });

  if (allNumeric) return "numeric";

  // Check if values look like dates
  const allDates = nonNullSample.every((v) => {
    if (typeof v !== "string") return false;
    const date = new Date(v);
    return !isNaN(date.getTime());
  });

  if (allDates) return "datetime";

  return "categorical";
}

function getColumnTypes(
  rows: Record<string, any>[],
  columns: string[]
): Map<string, ColumnType> {
  const types = new Map<string, ColumnType>();
  for (const col of columns) {
    types.set(col, detectColumnType(rows, col));
  }
  return types;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
];

export function ChartConfig({
  columns,
  data,
  config,
  onConfigChange,
}: ChartConfigProps) {
  const columnTypes = React.useMemo(
    () => getColumnTypes(data, columns),
    [data, columns]
  );

  const numericColumns = columns.filter(
    (col) => columnTypes.get(col) === "numeric"
  );
  const categoricalColumns = columns.filter(
    (col) =>
      columnTypes.get(col) === "categorical" ||
      columnTypes.get(col) === "datetime"
  );

  // Initialize config with smart defaults if not set
  React.useEffect(() => {
    if (!config && columns.length > 0) {
      const defaultXAxis =
        categoricalColumns[0] || columns.find((c) => c !== "__rowNum") || columns[0];
      const defaultYAxis = numericColumns[0]
        ? [numericColumns[0]]
        : columns.filter((c) => c !== defaultXAxis && c !== "__rowNum").slice(0, 1);

      if (defaultXAxis && defaultYAxis.length > 0) {
        onConfigChange({
          chartType: "bar",
          xAxis: defaultXAxis,
          yAxis: defaultYAxis,
        });
      }
    }
  }, [columns, config, categoricalColumns, numericColumns, onConfigChange]);

  const handleChartTypeChange = (chartType: ChartType) => {
    if (!config) return;
    onConfigChange({ ...config, chartType });
  };

  const handleXAxisChange = (xAxis: string) => {
    if (!config) return;
    // Remove xAxis from yAxis if it's there
    const newYAxis = config.yAxis.filter((y) => y !== xAxis);
    onConfigChange({
      ...config,
      xAxis,
      yAxis: newYAxis.length > 0 ? newYAxis : config.yAxis,
    });
  };

  const handleAddYAxis = (column: string) => {
    if (!config) return;
    if (config.yAxis.includes(column)) return;
    // For pie charts, only allow one Y axis
    if (config.chartType === "pie") {
      onConfigChange({ ...config, yAxis: [column] });
    } else {
      onConfigChange({ ...config, yAxis: [...config.yAxis, column] });
    }
  };

  const handleRemoveYAxis = (column: string) => {
    if (!config) return;
    if (config.yAxis.length <= 1) return; // Keep at least one
    onConfigChange({
      ...config,
      yAxis: config.yAxis.filter((y) => y !== column),
    });
  };

  // Available columns for Y-axis (exclude X-axis)
  const availableYColumns = columns.filter(
    (col) => col !== config?.xAxis && col !== "__rowNum"
  );

  // Columns not yet selected for Y-axis
  const unselectedYColumns = availableYColumns.filter(
    (col) => !config?.yAxis.includes(col)
  );

  if (!config) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        Loading chart configuration...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
      {/* Chart Type */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Type</span>
        <Select value={config.chartType} onValueChange={handleChartTypeChange}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* X-Axis */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">X-Axis</span>
        <Select value={config.xAxis} onValueChange={handleXAxisChange}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns
              .filter((col) => col !== "__rowNum")
              .map((col) => (
                <SelectItem key={col} value={col}>
                  <span className="flex items-center gap-2">
                    {col}
                    <span className="text-xs text-muted-foreground">
                      ({columnTypes.get(col)})
                    </span>
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Y-Axis */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Y-Axis</span>
        <div className="flex flex-wrap items-center gap-1">
          {config.yAxis.map((col) => (
            <Badge
              key={col}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {col}
              {config.yAxis.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveYAxis(col)}
                >
                  <X size={12} />
                </Button>
              )}
            </Badge>
          ))}
          {unselectedYColumns.length > 0 && config.chartType !== "pie" && (
            <Select value="" onValueChange={handleAddYAxis}>
              <SelectTrigger className="h-6 w-[80px] border-dashed">
                <span className="text-xs text-muted-foreground">+ Add</span>
              </SelectTrigger>
              <SelectContent>
                {unselectedYColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    <span className="flex items-center gap-2">
                      {col}
                      <span className="text-xs text-muted-foreground">
                        ({columnTypes.get(col)})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

    </div>
  );
}

export default ChartConfig;
