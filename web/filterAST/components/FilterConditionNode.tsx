import React from "react";
import { ConditionExpression, FilterOperator } from "../filterAst";
import { FilterUIDefinition } from "../filterUIDefinitions/types";
import { useFilterStore } from "../store/filterStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import SearchableSelect, {
  SearchableSelectOption,
} from "./ui/SearchableSelect";
import SearchableInput, { SearchableInputOption } from "./ui/SearchableInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterUIDefinitions } from "../filterUIDefinitions/useFilterUIDefinitions";

// Define the FILTER_OPERATOR_LABELS mapping
const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
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

interface FilterConditionNodeProps {
  condition: ConditionExpression;
  path: number[];
}

export const FilterConditionNode: React.FC<FilterConditionNodeProps> = ({
  condition,
  path,
}) => {
  const filterStore = useFilterStore();
  const { filterDefinitions: filterDefs, isLoading } = useFilterUIDefinitions();

  // Handle changing a field in a condition
  const handleFieldChange = (fieldId: string) => {
    // Find the filter definition for this field
    const filterDef = filterDefs.find((def) => def.id === fieldId);
    if (!filterDef) return;

    // Create updated field with default operator
    const defaultOperator = filterDef.operators[0] || "eq";
    const field = {
      column: fieldId,
      subtype: filterDef.subType,
    };

    // Create updated condition with new field and default operator
    const updated: ConditionExpression = {
      ...condition,
      field,
      operator: defaultOperator,
      value: "", // Reset value since field changed
    };

    filterStore.updateFilterExpression(path, updated);
  };

  // Handle changing the operator in a condition
  const handleOperatorChange = (operator: string) => {
    const updated = { ...condition, operator: operator as FilterOperator };
    filterStore.updateFilterExpression(path, updated);
  };

  // Handle changing the value in a condition
  const handleValueChange = (value: string | number | boolean) => {
    const updated = { ...condition, value };
    filterStore.updateFilterExpression(path, updated);
  };

  // Handle removing the condition
  const handleRemove = () => {
    filterStore.removeFilterExpression(path);
  };

  // Find the filter definition for this field
  const filterDef = filterDefs.find((def) => def.id === condition.field.column);

  // Get available operators
  const operators = filterDef?.operators || [];

  // ValueOptions for select-type fields
  const valueOptions = filterDef?.valueOptions || [];

  // Convert filterDefs to SearchableSelectOption format
  const fieldOptions: SearchableSelectOption[] = filterDefs.map((def) => ({
    label: def.label,
    value: def.id,
  }));

  // Convert operators to SearchableSelectOption format
  const operatorOptions: SearchableSelectOption[] = operators.map((op) => ({
    label: FILTER_OPERATOR_LABELS[op],
    value: op,
  }));

  // Convert valueOptions to SearchableSelectOption format if needed
  const selectValueOptions: SearchableSelectOption[] = valueOptions.map(
    (opt) => ({
      label: opt.label,
      value: String(opt.value),
    })
  );

  // Handle search function for searchable fields
  const handleSearch = async (
    searchTerm: string
  ): Promise<SearchableInputOption[]> => {
    if (!filterDef?.onSearch) return [];

    try {
      const results = await filterDef.onSearch(searchTerm);

      return results.map((result) => ({
        label: result.label,
        value: String(result.value),
      }));
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  };

  if (!filterDef) {
    return (
      <div className="p-3 border rounded-md bg-card">
        No filter definition found
      </div>
    );
  }

  // Render value input based on field type
  const renderValueInput = () => {
    // For searchable fields with onSearch function
    if (filterDef?.type === "searchable" && filterDef.onSearch) {
      return (
        <SearchableInput
          value={String(condition.value)}
          onValueChange={handleValueChange}
          onSearch={handleSearch}
          placeholder="Type to search..."
          emptyMessage="No results found"
          disabled={!condition.field.column || !condition.operator}
          className="w-full h-9"
        />
      );
    }

    // For select-type fields with valueOptions
    if (filterDef?.type === "select" || valueOptions.length > 0) {
      return (
        <SearchableSelect
          options={selectValueOptions}
          value={String(condition.value)}
          onValueChange={handleValueChange}
          placeholder="Select value"
          searchPlaceholder="Search value..."
          emptyMessage="No value found."
          disabled={!condition.field.column || !condition.operator}
          className="w-full h-9"
        />
      );
    }

    // Default: regular input
    return (
      <Input
        value={String(condition.value)}
        onChange={(e) => handleValueChange(e.target.value)}
        disabled={!condition.field.column || !condition.operator}
        placeholder="Enter value"
        className="w-full h-9"
      />
    );
  };

  return (
    <div className="flex flex-row items-center gap-2 p-3 border rounded-md bg-card">
      <SearchableSelect
        options={fieldOptions}
        value={condition.field.column}
        onValueChange={handleFieldChange}
        placeholder="Select field"
        searchPlaceholder="Search field..."
        emptyMessage="No field found."
        width="180px"
        className="flex-shrink-0 h-9"
      />

      <Select
        value={condition.operator}
        onValueChange={handleOperatorChange}
        disabled={!condition.field.column}
      >
        <SelectTrigger className="w-[60px] h-9 px-2 flex-shrink-0 text-center">
          <SelectValue placeholder="Op" />
        </SelectTrigger>
        <SelectContent>
          {operatorOptions.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-grow">{renderValueInput()}</div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        className="flex-shrink-0 ml-1"
      >
        <Trash2 size={16} className="text-muted-foreground" />
      </Button>
    </div>
  );
};

export default FilterConditionNode;
