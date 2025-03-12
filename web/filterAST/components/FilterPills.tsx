import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "../store/filterStore";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
  FilterOperator,
} from "../filterAst";
import { useFilterUIDefinitions } from "../filterUIDefinitions/useFilterUIDefinitions";

// Define the FILTER_OPERATOR_LABELS mapping for compact display
const COMPACT_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "=",
  neq: "≠",
  is: "is",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  like: "~",
  ilike: "≈",
  contains: "⊃",
  in: "∈",
};

interface FilterPillsProps {
  maxPills?: number;
  onClearAll?: () => void;
  className?: string;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  maxPills = 5,
  onClearAll,
  className = "",
}) => {
  const { filter } = useFilterStore();
  const { filterDefinitions } = useFilterUIDefinitions();

  // Extract all conditions from the filter tree
  const conditions = useMemo(() => {
    if (!filter) return [];

    const result: { condition: ConditionExpression; path: number[] }[] = [];

    // Recursive function to extract conditions
    const extractConditions = (
      expr: FilterExpression,
      currentPath: number[] = []
    ) => {
      if (expr.type === "condition") {
        result.push({
          condition: expr as ConditionExpression,
          path: [...currentPath],
        });
      } else if (expr.type === "and" || expr.type === "or") {
        const compoundExpr = expr as AndExpression | OrExpression;
        compoundExpr.expressions.forEach((childExpr, index) => {
          extractConditions(childExpr, [...currentPath, index]);
        });
      }
    };

    extractConditions(filter);
    return result;
  }, [filter]);

  // Get field label from field ID
  const getFieldLabel = (fieldId: string): string => {
    const def = filterDefinitions.find((def) => def.id === fieldId);
    return def?.label || fieldId;
  };

  // Format value for display
  const formatValue = (value: string | number | boolean): string => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (value === null || value === undefined) {
      return "null";
    }
    return String(value);
  };

  // Handle removing a specific condition
  const handleRemoveCondition = (path: number[]) => {
    const filterStore = useFilterStore();
    filterStore.removeFilterExpression(path);
  };

  // Handle clearing all filters
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      const filterStore = useFilterStore();
      filterStore.setFilter({
        type: "and",
        expressions: [],
      });
    }
  };

  // If no conditions, show empty state
  if (conditions.length === 0) {
    return null;
  }

  // Get the conditions to display (limited by maxPills)
  const displayConditions = conditions.slice(0, maxPills);
  const hasMore = conditions.length > maxPills;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayConditions.map(({ condition, path }, index) => {
        const fieldLabel = getFieldLabel(condition.field.column);
        const operatorLabel =
          COMPACT_OPERATOR_LABELS[condition.operator] || condition.operator;
        const valueLabel = formatValue(condition.value);

        // For property or score conditions, include the key in the field label
        let displayFieldLabel = fieldLabel;
        if (condition.field.subtype === "property" && condition.field.key) {
          displayFieldLabel = `${fieldLabel}.${condition.field.key}`;
        } else if (condition.field.subtype === "score" && condition.field.key) {
          displayFieldLabel = `${fieldLabel}.${condition.field.key}`;
        }

        return (
          <Badge
            key={index}
            variant="outline"
            className="flex items-center gap-1 py-1 px-2 bg-slate-50 dark:bg-slate-800 text-xs"
          >
            <span className="font-medium">{displayFieldLabel}</span>
            <span className="mx-0.5">{operatorLabel}</span>
            <span className="max-w-[100px] truncate">{valueLabel}</span>
            <Button
              variant="ghost"
              size="sm_sleek"
              className="h-4 w-4 p-0 ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
              onClick={() => handleRemoveCondition(path)}
            >
              <X size={10} />
            </Button>
          </Badge>
        );
      })}

      {hasMore && (
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
          +{conditions.length - maxPills} more
        </Badge>
      )}

      {conditions.length > 0 && (
        <Button
          variant="ghost"
          size="sm_sleek"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={handleClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

export default FilterPills;
