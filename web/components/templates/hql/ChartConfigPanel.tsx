// Re-export VisualizationConfig from ChartConfigModal for backwards compatibility
export { VisualizationConfig } from "./ChartConfigModal";

interface ChartConfigPanelProps {
  columns: string[];
  data: Record<string, any>[];
  config: VisualizationConfig | undefined;
  onConfigChange: (config: VisualizationConfig | undefined) => void;
}

// Helper to detect if a column appears to be numeric based on sample data
function isNumericColumn(data: Record<string, any>[], column: string): boolean {
  if (!data || data.length === 0) return false;

  // Check first few non-null values
  const samples = data.slice(0, 10).map(row => row[column]).filter(v => v != null);
  if (samples.length === 0) return false;

  // If all samples are numbers, it's numeric
  return samples.every(v => typeof v === 'number' || !isNaN(Number(v)));
}

export function ChartConfigPanel({
  columns,
  data,
  config,
  onConfigChange,
}: ChartConfigPanelProps) {
  // Get numeric columns for Y-axis
  const numericColumns = columns.filter(col => isNumericColumn(data, col));

  // Get potential X-axis columns (all columns)
  const xAxisColumns = columns;

  const handleTypeChange = (type: "line" | "bar" | "area") => {
    if (config) {
      onConfigChange({ ...config, type });
    }
  };

  const handleXAxisChange = (xAxis: string) => {
    if (config) {
      onConfigChange({ ...config, xAxis });
    }
  };

  const handleYAxisChange = (yAxis: string) => {
    if (config) {
      onConfigChange({ ...config, yAxis: [yAxis] });
    }
  };

  const handleDisable = () => {
    onConfigChange(undefined);
  };

  const handleInitialize = () => {
    // Smart defaults
    const xAxis = columns.includes("request_created_at")
      ? "request_created_at"
      : columns[0] || "";

    const yAxis = numericColumns.length > 0 ? [numericColumns[0]] : [];

    onConfigChange({
      type: "line",
      xAxis,
      yAxis,
    });
  };

  if (!config) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          Configure chart to visualize your data
        </span>
        <Button variant="outline" size="sm" onClick={handleInitialize}>
          <LineChart size={14} className="mr-2" />
          Configure Chart
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Chart Type</Label>
        <Select
          value={config?.type}
          onValueChange={(v) => handleTypeChange(v as "line" | "bar" | "area")}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">
              <div className="flex items-center gap-2">
                <LineChart size={14} />
                Line
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} />
                Bar
              </div>
            </SelectItem>
            <SelectItem value="area">
              <div className="flex items-center gap-2">
                <AreaChart size={14} />
                Area
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">X-Axis</Label>
        <Select value={config?.xAxis} onValueChange={handleXAxisChange}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {xAxisColumns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Y-Axis</Label>
        <Select
          value={config?.yAxis[0]}
          onValueChange={handleYAxisChange}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {numericColumns.length > 0 ? (
              numericColumns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                No numeric columns found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisable}
        className="h-8 w-8 p-0"
        title="Clear chart configuration"
      >
        <X size={14} />
      </Button>
    </div>
  );
}
