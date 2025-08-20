import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterExpression } from "@/filterAST/filterAst";
import { Small } from "@/components/ui/typography";
import LocalFilterEditor from "./LocalFilterEditor";

export type AggregationConfig = {
  field: string;
  function: string;
  comparison: string;
  threshold: number;
  whereFilter?: FilterExpression | null;
};

interface AggregationBuilderProps {
  value?: AggregationConfig;
  onChange: (config: AggregationConfig) => void;
}

const AGGREGATION_FIELDS = [
  { value: "latency", label: "Latency (ms)" },
  { value: "cost", label: "Cost ($)" },
  { value: "completion_tokens", label: "Completion Tokens" },
  { value: "prompt_tokens", label: "Prompt Tokens" },
  { value: "total_tokens", label: "Total Tokens" },
  { value: "time_to_first_token", label: "Time to First Token (ms)" },
  { value: "status", label: "Status Code" },
];

const AGGREGATION_FUNCTIONS = [
  { value: "avg", label: "Average" },
  { value: "sum", label: "Sum" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "count", label: "Count" },
  { value: "p50", label: "P50 (Median)" },
  { value: "p75", label: "P75" },
  { value: "p90", label: "P90" },
  { value: "p95", label: "P95" },
  { value: "p99", label: "P99" },
];

const COMPARISON_OPERATORS = [
  { value: "gt", label: "Greater than (>)" },
  { value: "gte", label: "Greater than or equal (≥)" },
  { value: "lt", label: "Less than (<)" },
  { value: "lte", label: "Less than or equal (≤)" },
  { value: "equals", label: "Equals (=)" },
];

export const AggregationBuilder: React.FC<AggregationBuilderProps> = ({
  value,
  onChange,
}) => {
  const [config, setConfig] = React.useState<AggregationConfig>(
    value || {
      field: "latency",
      function: "p95",
      comparison: "gt",
      threshold: 0,
      whereFilter: null,
    }
  );

  const updateConfig = (updates: Partial<AggregationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Field</Label>
          <Select
            value={config.field}
            onValueChange={(value) => updateConfig({ field: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {AGGREGATION_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aggregation Function</Label>
          <Select
            value={config.function}
            onValueChange={(value) => updateConfig({ function: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a function" />
            </SelectTrigger>
            <SelectContent>
              {AGGREGATION_FUNCTIONS.map((func) => (
                <SelectItem key={func.value} value={func.value}>
                  {func.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Comparison</Label>
          <Select
            value={config.comparison}
            onValueChange={(value) => updateConfig({ comparison: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select comparison" />
            </SelectTrigger>
            <SelectContent>
              {COMPARISON_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Threshold Value</Label>
          <Input
            type="number"
            value={config.threshold}
            onChange={(e) =>
              updateConfig({ threshold: parseFloat(e.target.value) || 0 })
            }
            placeholder="Enter threshold"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Optional Filters (WHERE clause)</Label>
        <LocalFilterEditor
          value={config.whereFilter || null}
          onChange={(filter) => updateConfig({ whereFilter: filter })}
          placeholder="Add filter conditions (optional)"
        />
        <Small className="text-muted-foreground">
          Only aggregate data that matches these filters
        </Small>
      </div>

      <div className="rounded-md bg-muted p-3">
        <Small className="font-medium">Alert will trigger when:</Small>
        <Small className="text-muted-foreground">
          {AGGREGATION_FUNCTIONS.find((f) => f.value === config.function)
            ?.label || config.function}{" "}
          of{" "}
          {AGGREGATION_FIELDS.find((f) => f.value === config.field)?.label ||
            config.field}{" "}
          {COMPARISON_OPERATORS.find((o) => o.value === config.comparison)
            ?.label.toLowerCase() || config.comparison}{" "}
          {config.threshold}
          {config.whereFilter && (
            <>
              <br />
              <span className="text-xs">
                with filter conditions applied
              </span>
            </>
          )}
        </Small>
      </div>
    </div>
  );
};

export default AggregationBuilder;