import React from "react";
import { ConditionExpression, FilterOperator } from "../filterAst";
import { useFilterStore } from "../store/filterStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Trash2, Loader2 } from "lucide-react";
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
import clsx from "clsx";
import { Small } from "@/components/ui/typography";

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

// Define descriptive operator labels for dropdown menu
const FILTER_OPERATOR_DESCRIPTIVE_LABELS: Record<FilterOperator, string> = {
  eq: "Equals (=)",
  neq: "Not Equals (≠)",
  is: "Is",
  gt: "Greater Than (>)",
  gte: "Greater Than or Equal (≥)",
  lt: "Less Than (<)",
  lte: "Less Than or Equal (≤)",
  like: "Like (~)",
  ilike: "Case Insensitive Like (≈)",
  contains: "Contains (⊃)",
  in: "In (∈)",
};

// Component for number input with suggestions
const NumberInput: React.FC<{
  value: string | number;
  onValueChange: (value: number) => void;
  suggestions?: { label: string; value: number }[];
  disabled?: boolean;
  className?: string;
}> = ({
  value,
  onValueChange,
  suggestions = [],
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Format display value to remove leading zeros but preserve decimals
  const formatDisplayValue = (val: string | number): string => {
    if (val === 0 || val === "0") return "0";

    if (typeof val === "string") {
      // If it's a string with leading zeros (not a decimal)
      if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
        return parseFloat(val).toString();
      }
    }
    return val.toString();
  };

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // For empty input, use 0
    if (inputValue === "") {
      onValueChange(0);
      return;
    }

    // If it has leading zeros (but is not a decimal), remove them
    if (
      inputValue.startsWith("0") &&
      inputValue.length > 1 &&
      inputValue[1] !== "."
    ) {
      const cleanValue = inputValue.replace(/^0+/, "");
      const numericValue = Number(cleanValue);
      if (!isNaN(numericValue)) {
        onValueChange(numericValue);
      }
      return;
    }

    // Parse the input as a number
    const numericValue = Number(inputValue);

    // Only update if it's a valid number
    if (!isNaN(numericValue)) {
      onValueChange(numericValue);
    }
  };

  // Handle clicking outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Convert suggestions to SearchableSelectOption format
  const selectOptions: SearchableSelectOption[] = suggestions.map((opt) => ({
    label: opt.label,
    value: String(opt.value),
  }));

  const toggleDropdown = () => {
    if (!disabled && selectOptions.length > 0) {
      setOpen(!open);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex">
        <Input
          type="number"
          value={formatDisplayValue(value)}
          onChange={handleInputChange}
          disabled={disabled}
          className={`w-full h-7 text-[10px] ${className}`}
        />
        {selectOptions.length > 0 && (
          <ChevronDown
            className={clsx(
              "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-transform",
              open && "rotate-180"
            )}
            size={10}
            onClick={toggleDropdown}
          />
        )}
      </div>
      {open && selectOptions.length > 0 && (
        <div className="absolute w-full top-8 left-0 z-10 bg-white dark:bg-slate-950 border border-border shadow-md max-h-[200px] overflow-y-auto">
          {selectOptions.map((option) => (
            <div
              key={option.value}
              className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-[10px]"
              onClick={() => {
                onValueChange(Number(option.value));
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterConditionNodeProps {
  condition: ConditionExpression;
  path: number[];
  isFirst?: boolean;
  isLast?: boolean;
}

export const FilterConditionNode: React.FC<FilterConditionNodeProps> = ({
  condition,
  path,
  isFirst = false,
  isLast = false,
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

    // Create updated condition with new field and default operator
    const updated: ConditionExpression = {
      ...condition,
      field: {
        column: fieldId as any, // Use 'any' to bypass type checking temporarily
        subtype: filterDef.subType,
        table: filterDef.table,
      },
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
    const parentPath = filterStore.getParentPath(path);
    const parentExpression = filterStore.getFilterExpression(parentPath);

    if (parentExpression?.type == "and" || parentExpression?.type == "or") {
      if (parentExpression.expressions.length === 1) {
        return filterStore.removeFilterExpression(parentPath);
      }
    }

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
    subType: def.subType,
  }));

  // Convert operators to SearchableSelectOption format
  const operatorOptions: SearchableSelectOption[] = operators.map((op) => ({
    label: FILTER_OPERATOR_DESCRIPTIVE_LABELS[op],
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
  if (isLoading) {
    return (
      <div className="p-2 border border-border bg-accent rounded-md flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        <Small className="text-muted-foreground">
          Loading filter options...
        </Small>
      </div>
    );
  }
  if (!filterDef) {
    return (
      <div className="p-2 border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            Invalid field: &quot;{condition.field.column || "empty"}&quot;
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            Please select a valid field or remove
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          className="border h-6 w-6 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    );
  }

  // Render value input based on field type
  const renderValueInput = () => {
    // For number fields with valueOptions
    if (filterDef?.type === "number") {
      // Convert value to number for NumberInput
      let numValue: number = 0;

      if (typeof condition.value === "boolean") {
        numValue = condition.value ? 1 : 0;
      } else if (typeof condition.value === "string") {
        // For strings, parse as float (handles both integers and decimals)
        numValue = parseFloat(condition.value) || 0;
      } else if (typeof condition.value === "number") {
        numValue = condition.value;
      }

      return (
        <NumberInput
          value={numValue}
          onValueChange={(val) => handleValueChange(val)}
          suggestions={valueOptions as { label: string; value: number }[]}
          disabled={!condition.field.column || !condition.operator}
          className="w-full border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
        />
      );
    }

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
          className="w-full h-7 border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
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
          className="w-full h-7 text-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
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
        className="w-full h-7 text-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
      />
    );
  };

  return (
    <div
      className={clsx(
        "flex flex-row items-center border bg-slate-100 dark:bg-slate-950",
        isFirst && "rounded-t-md",
        isLast && "rounded-b-md"
      )}
    >
      <SearchableSelect
        options={fieldOptions}
        value={condition.field.column}
        onValueChange={handleFieldChange}
        placeholder="Select field"
        searchPlaceholder="Search field..."
        emptyMessage="No field found."
        width="200px"
        className={clsx(
          "flex-shrink-0 h-7 text-[10px] border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-none"
        )}
      />
      <Select
        value={condition.operator}
        onValueChange={handleOperatorChange}
        disabled={!condition.field.column}
      >
        <SelectTrigger className="w-[40px] h-7 px-1 flex-shrink-0 text-center text-[10px] font-normal border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent rounded-l-none">
          <SelectValue placeholder="Op">
            {condition.operator &&
              FILTER_OPERATOR_LABELS[condition.operator as FilterOperator]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="focus-visible:ring-0 focus-visible:ring-offset-0">
          {operatorOptions.map((op) => (
            <SelectItem
              key={op.value}
              value={op.value}
              className="text-[10px] font-normal focus-visible:ring-0 focus-visible:ring-offset-0"
            >
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
        className="flex-shrink-0 h-6  border-none px-1"
      >
        <Trash2 size={12} className="" />
      </Button>
    </div>
  );
};

export default FilterConditionNode;
