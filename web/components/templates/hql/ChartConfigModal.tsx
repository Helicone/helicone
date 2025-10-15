import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  BarChart3,
  AreaChart,
  PieChart,
  ScatterChart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VisualizationConfig {
  type: "line" | "bar" | "area" | "pie" | "scatter";
  xAxis: string;
  yAxis: string[];
  colors?: string[];
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  legendPosition?: "top" | "bottom" | "left" | "right" | "hidden";
}

interface ChartConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  data: Record<string, any>[];
  config: VisualizationConfig | undefined;
  onConfigChange: (config: VisualizationConfig | undefined) => void;
}

// Helper to detect if a column appears to be numeric based on sample data
function isNumericColumn(data: Record<string, any>[], column: string): boolean {
  if (!data || data.length === 0) return false;
  const samples = data.slice(0, 10).map((row) => row[column]).filter((v) => v != null);
  if (samples.length === 0) return false;
  return samples.every((v) => typeof v === "number" || !isNaN(Number(v)));
}

// Detect column type
function getColumnType(data: Record<string, any>[], column: string): "number" | "string" | "?" {
  if (!data || data.length === 0) return "?";
  const samples = data.slice(0, 10).map((row) => row[column]).filter((v) => v != null);
  if (samples.length === 0) return "?";

  if (samples.every((v) => typeof v === "number" || !isNaN(Number(v)))) {
    return "number";
  }
  return "string";
}

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineChart },
  { value: "area", label: "Area", icon: AreaChart },
  { value: "pie", label: "Pie", icon: PieChart },
  { value: "scatter", label: "Scatter", icon: ScatterChart },
] as const;

export function ChartConfigModal({
  open,
  onOpenChange,
  columns,
  data,
  config,
  onConfigChange,
}: ChartConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<VisualizationConfig | undefined>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleApply = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onOpenChange(false);
  };

  const toggleXAxis = (column: string) => {
    if (!localConfig) {
      // Initialize with defaults
      setLocalConfig({
        type: "bar",
        xAxis: column,
        yAxis: [],
      });
    } else {
      setLocalConfig({
        ...localConfig,
        xAxis: column,
      });
    }
  };

  const toggleYAxis = (column: string) => {
    if (!localConfig) {
      setLocalConfig({
        type: "bar",
        xAxis: "",
        yAxis: [column],
      });
    } else {
      const isSelected = localConfig.yAxis.includes(column);
      setLocalConfig({
        ...localConfig,
        yAxis: isSelected
          ? localConfig.yAxis.filter((c) => c !== column)
          : [...localConfig.yAxis, column],
      });
    }
  };

  const updateChartType = (type: VisualizationConfig["type"]) => {
    setLocalConfig(
      localConfig
        ? { ...localConfig, type }
        : { type, xAxis: "", yAxis: [] }
    );
  };

  const updateField = (field: keyof VisualizationConfig, value: any) => {
    if (!localConfig) return;
    setLocalConfig({ ...localConfig, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chart details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Chart Type */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Chart type</Label>
              </div>
              <Select
                value={localConfig?.type || "bar"}
                onValueChange={(v) => updateChartType(v as VisualizationConfig["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon size={14} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column Configuration */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium pb-2 border-b">
                <div className="col-span-6">Column</div>
                <div className="col-span-2 text-center">Type</div>
                <div className="col-span-2 text-center">X</div>
                <div className="col-span-2 text-center">Y</div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {columns.map((column) => {
                  const columnType = getColumnType(data, column);
                  const isXAxis = localConfig?.xAxis === column;
                  const isYAxis = localConfig?.yAxis.includes(column) || false;
                  const isNumeric = columnType === "number";

                  return (
                    <div
                      key={column}
                      className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-muted/50 rounded px-2"
                    >
                      <div className="col-span-6 text-sm truncate" title={column}>
                        {column}
                      </div>
                      <div className="col-span-2 text-center text-sm text-muted-foreground">
                        {columnType}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Switch
                          checked={isXAxis}
                          onCheckedChange={() => toggleXAxis(column)}
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <Switch
                          checked={isYAxis}
                          onCheckedChange={() => toggleYAxis(column)}
                          disabled={!isNumeric}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6">
              {/* Title and Subtitle */}
              <div className="space-y-3">
                <Label>Subtitle</Label>
                <Input
                  value={localConfig?.subtitle || ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="Enter chart subtitle"
                />
              </div>

              {/* Axis Labels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>X axis title</Label>
                  <Input
                    value={localConfig?.xAxisLabel || ""}
                    onChange={(e) => updateField("xAxisLabel", e.target.value)}
                    placeholder="Enter an x-axis label"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Y axis title</Label>
                  <Input
                    value={localConfig?.yAxisLabel || ""}
                    onChange={(e) => updateField("yAxisLabel", e.target.value)}
                    placeholder="Enter a y-axis label"
                  />
                </div>
              </div>

              {/* Legend Position */}
              <div className="space-y-3">
                <Label>Legend position</Label>
                <Select
                  value={localConfig?.legendPosition || "hidden"}
                  onValueChange={(v) => updateField("legendPosition", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
