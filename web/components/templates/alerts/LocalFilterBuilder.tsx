import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
  FilterOperator,
} from "@helicone-package/filters";
import { Small } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterUIDefinitions } from "@/filterAST/filterUIDefinitions/useFilterUIDefinitions";
import FilterConditionRow from "@/filterAST/components/FilterConditionRow";

interface LocalFilterBuilderProps {
  value: FilterExpression | null;
  onChange: (filter: FilterExpression | null) => void;
  onApply?: () => void;
  onCancel?: () => void;
}

export const LocalFilterBuilder: React.FC<LocalFilterBuilderProps> = ({
  value,
  onChange,
  onApply,
  onCancel,
}) => {
  // Get filter definitions from the hook
  const { filterDefinitions, isLoading } = useFilterUIDefinitions();

  // Initialize from value prop
  const initializeConditions = () => {
    if (!value) return [];
    
    // Single condition
    if (value.type === "condition") {
      return [value as ConditionExpression];
    }
    
    // AND/OR expression with conditions
    if (value.type === "and" || value.type === "or") {
      const groupExpr = value as AndExpression | OrExpression;
      return groupExpr.expressions.filter(
        (e) => e.type === "condition"
      ) as ConditionExpression[];
    }
    
    return [];
  };

  const [conditions, setConditions] = useState<ConditionExpression[]>(initializeConditions);
  const [groupOperator, setGroupOperator] = useState<"and" | "or">(() => {
    if (value && (value.type === "and" || value.type === "or")) {
      return value.type;
    }
    return "and";
  });

  const addCondition = () => {
    const newCondition: ConditionExpression = {
      type: "condition",
      field: {
        table: "request_response_rmt",
        column: "status" as any,
      },
      operator: "eq",
      value: 200,
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<ConditionExpression>) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      ...updates,
    };
    setConditions(newConditions);
  };

  const handleFieldChange = (index: number, fieldId: string) => {
    // Find the filter definition for this field
    const filterDef = filterDefinitions.find((def) => def.id === fieldId);
    if (!filterDef) return;

    // Create updated field with default operator and value
    const defaultOperator = filterDef.operators[0] || "eq";
    const defaultValue = (() => {
      switch (filterDef.type) {
        case "number":
          return 0;
        case "boolean":
          return true;
        default:
          return "";
      }
    })();

    updateCondition(index, {
      field: {
        column: fieldId as any,
        subtype: filterDef.subType,
        table: filterDef.table,
      },
      operator: defaultOperator as FilterOperator,
      value: defaultValue,
    });
  };

  const handleOperatorChange = (index: number, operator: FilterOperator) => {
    updateCondition(index, { operator });
  };

  const handleValueChange = (index: number, value: string | number | boolean) => {
    updateCondition(index, { value });
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const buildFilter = (conditions: ConditionExpression[]): FilterExpression | null => {
    if (conditions.length === 0) {
      return null;
    } else if (conditions.length === 1) {
      return conditions[0];
    } else {
      const groupExpr: AndExpression | OrExpression = {
        type: groupOperator,
        expressions: conditions,
      };
      return groupExpr;
    }
  };

  const handleApply = () => {
    const filter = buildFilter(conditions);
    onChange(filter);
    onApply?.();
  };

  const handleCancel = () => {
    // Reset to original value
    setConditions(initializeConditions());
    onCancel?.();
  };

  return (
    <div className="space-y-3">
      {conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <Small className="text-muted-foreground">Group conditions with:</Small>
          <Select
            value={groupOperator}
            onValueChange={(v: "and" | "or") => {
              setGroupOperator(v);
            }}
          >
            <SelectTrigger className="w-24 h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">AND</SelectItem>
              <SelectItem value="or">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={index}>
            {index > 0 && (
              <Small className="text-muted-foreground uppercase pl-2">
                {groupOperator}
              </Small>
            )}
            <FilterConditionRow
              condition={condition}
              filterDefinitions={filterDefinitions}
              onFieldChange={(fieldId) => handleFieldChange(index, fieldId)}
              onOperatorChange={(operator) => handleOperatorChange(index, operator)}
              onValueChange={(value) => handleValueChange(index, value)}
              onRemove={() => removeCondition(index)}
              isFirst={index === 0}
              isLast={index === conditions.length - 1}
              isLoading={isLoading}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={addCondition}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>

      {/* Apply/Cancel buttons */}
      <div className="flex justify-end gap-2 pt-3 border-t">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default LocalFilterBuilder;