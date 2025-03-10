import React, { useState } from "react";
import { useFilterUIDefinitions } from "./filterUIDefinitions/useFilterUIDefinitions";
import { useFilterStore } from "./store/filterStore";
import {
  FilterExpression,
  FilterOperator,
  ConditionExpression,
  AndExpression,
  OrExpression,
} from "./filterAst";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterUIDefinition } from "./filterUIDefinitions/types";
import { H4, P, Small } from "@/components/ui/typography";
import {
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Trash2,
  Save,
  X,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface FilterASTEditorProps {
  onFilterChange?: (filter: FilterExpression) => void;
  layoutPage?: "dashboard" | "requests";
}

// Define the FILTER_OPERATOR_LABELS mapping locally if not exported from filterAst.ts
const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "not equals",
  is: "is",
  gt: "greater than",
  gte: "greater than or equals",
  lt: "less than",
  lte: "less than or equals",
  like: "contains (case sensitive)",
  ilike: "contains (case insensitive)",
  contains: "contains",
  in: "in",
};

export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  onFilterChange,
  layoutPage = "requests",
}) => {
  const { filterDefinitions, isLoading } = useFilterUIDefinitions();
  const filterStore = useFilterStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  // Call the onFilterChange callback whenever the filter changes
  React.useEffect(() => {
    if (onFilterChange && filterStore.filter) {
      onFilterChange(filterStore.filter);
    }
  }, [filterStore.filter, onFilterChange]);

  // Function to toggle node expansion
  const toggleExpanded = (path: string) => {
    if (expandedPaths.includes(path)) {
      setExpandedPaths(expandedPaths.filter((p) => p !== path));
    } else {
      setExpandedPaths([...expandedPaths, path]);
    }
  };

  // Check if a path is expanded
  const isExpanded = (path: string) => {
    return expandedPaths.includes(path);
  };

  // Handle adding a new condition to a group
  const handleAddCondition = (path: number[]) => {
    // Create a new empty condition
    const newCondition: ConditionExpression = {
      type: "condition",
      field: { column: "" },
      operator: "eq",
      value: "",
    };

    filterStore.addFilterExpression(path, newCondition);
  };

  // Handle adding a new group (AND/OR) to a parent group
  const handleAddGroup = (path: number[], groupType: "and" | "or") => {
    const newGroup: AndExpression | OrExpression = {
      type: groupType,
      expressions: [],
    };

    filterStore.addFilterExpression(path, newGroup);

    // Automatically expand the new group
    const newPath =
      path.length > 0
        ? `${path.join(".")}.${
            filterStore.filter?.type === "and" ||
            filterStore.filter?.type === "or"
              ? filterStore.filter.expressions.length - 1
              : 0
          }`
        : "0";

    if (!expandedPaths.includes(newPath)) {
      setExpandedPaths([...expandedPaths, newPath]);
    }
  };

  // Handle changing the operator of a group (AND/OR)
  const handleGroupOperatorChange = (path: number[], newType: "and" | "or") => {
    if (!filterStore.filter) return;

    // Get the current node
    let current = filterStore.filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") return;
      current = current.expressions[path[i]];
    }

    if (current.type === "and" || current.type === "or") {
      const updated = { ...current, type: newType };
      filterStore.updateFilterExpression(path, updated);
    }
  };

  // Handle changing a field in a condition
  const handleFieldChange = (
    path: number[],
    fieldId: string,
    filterDefs: FilterUIDefinition[]
  ) => {
    if (!filterStore.filter) return;

    // Get the current node
    let current = filterStore.filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") return;
      current = current.expressions[path[i]];
    }

    if (current.type === "condition") {
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
        ...current,
        field,
        operator: defaultOperator,
        value: "", // Reset value since field changed
      };

      filterStore.updateFilterExpression(path, updated);
    }
  };

  // Handle changing the operator in a condition
  const handleOperatorChange = (path: number[], operator: FilterOperator) => {
    if (!filterStore.filter) return;

    // Get the current node
    let current = filterStore.filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") return;
      current = current.expressions[path[i]];
    }

    if (current.type === "condition") {
      const updated = { ...current, operator };
      filterStore.updateFilterExpression(path, updated);
    }
  };

  // Handle changing the value in a condition
  const handleValueChange = (
    path: number[],
    value: string | number | boolean
  ) => {
    if (!filterStore.filter) return;

    // Get the current node
    let current = filterStore.filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") return;
      current = current.expressions[path[i]];
    }

    if (current.type === "condition") {
      const updated = { ...current, value };
      filterStore.updateFilterExpression(path, updated);
    }
  };

  // Handle removing a node
  const handleRemoveNode = (path: number[]) => {
    filterStore.removeFilterExpression(path);
  };

  // Handle saving a filter
  const handleSaveFilter = () => {
    if (filterStore.filter && filterName.trim()) {
      filterStore.saveFilter(filterName.trim(), filterStore.filter);
      setFilterName("");
      setSaveDialogOpen(false);
    }
  };

  // Handle loading a saved filter
  const handleLoadFilter = (id: string) => {
    filterStore.loadSavedFilter(id);
  };

  // Render a condition node
  const renderCondition = (
    condition: ConditionExpression,
    path: number[],
    filterDefs: FilterUIDefinition[]
  ) => {
    // Find the filter definition for this field
    const filterDef = filterDefs.find(
      (def) => def.id === condition.field.column
    );

    // Get available operators
    const operators = filterDef?.operators || [];

    // ValueOptions for select-type fields
    const valueOptions = filterDef?.valueOptions || [];

    return (
      <div className="flex flex-col gap-2 p-3 border rounded-md bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Small className="text-muted-foreground">Field</Small>
            <Select
              value={condition.field.column}
              onValueChange={(value) =>
                handleFieldChange(path, value, filterDefs)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {filterDefs.map((def) => (
                  <SelectItem key={def.id} value={def.id}>
                    {def.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveNode(path)}
          >
            <Trash2 size={16} className="text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Small className="text-muted-foreground">Operator</Small>
          <Select
            value={condition.operator}
            onValueChange={(value) =>
              handleOperatorChange(path, value as FilterOperator)
            }
            disabled={!condition.field.column}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op} value={op}>
                  {FILTER_OPERATOR_LABELS[op]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Small className="text-muted-foreground">Value</Small>
          {filterDef?.type === "select" || valueOptions.length > 0 ? (
            <Select
              value={String(condition.value)}
              onValueChange={(value) => handleValueChange(path, value)}
              disabled={!condition.field.column || !condition.operator}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {valueOptions.map((option) => (
                  <SelectItem
                    key={String(option.value)}
                    value={String(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={String(condition.value)}
              onChange={(e) => handleValueChange(path, e.target.value)}
              disabled={!condition.field.column || !condition.operator}
              placeholder="Enter value"
              className="w-full"
            />
          )}
        </div>
      </div>
    );
  };

  // Render a group node (AND/OR)
  const renderGroup = (
    group: AndExpression | OrExpression,
    path: number[] = [],
    filterDefs: FilterUIDefinition[]
  ): JSX.Element => {
    const pathKey = path.join(".");

    return (
      <div className="p-3 border rounded-md bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleExpanded(pathKey)}
            >
              {isExpanded(pathKey) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </Button>
            <Select
              value={group.type}
              onValueChange={(value) =>
                handleGroupOperatorChange(path, value as "and" | "or")
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Group type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">AND</SelectItem>
                <SelectItem value="or">OR</SelectItem>
              </SelectContent>
            </Select>
            <Small className="text-muted-foreground">
              {group.expressions.length}{" "}
              {group.expressions.length === 1 ? "condition" : "conditions"}
            </Small>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <PlusCircle size={16} className="mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAddCondition(path)}>
                  Add Condition
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddGroup(path, "and")}>
                  Add AND Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddGroup(path, "or")}>
                  Add OR Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {path.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveNode(path)}
              >
                <Trash2 size={16} className="text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded(pathKey) && (
          <div className="pl-4 border-l border-border space-y-2">
            {group.expressions.length === 0 ? (
              <P className="text-muted-foreground py-2">
                No conditions. Click &quot;Add&quot; to create one.
              </P>
            ) : (
              group.expressions.map((expr, index) => {
                const newPath = [...path, index];
                if (expr.type === "and" || expr.type === "or") {
                  return (
                    <div key={`group-${index}`} className="mt-2">
                      {renderGroup(expr, newPath, filterDefs)}
                    </div>
                  );
                } else if (expr.type === "condition") {
                  return (
                    <div key={`condition-${index}`}>
                      {renderCondition(expr, newPath, filterDefs)}
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>
        )}
      </div>
    );
  };

  // Create the root if it doesn't exist
  if (!filterStore.filter) {
    filterStore.setFilter({
      type: "and",
      expressions: [],
    });
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <H4>Filters</H4>
          {filterStore.filter &&
            filterStore.filter.type !== "all" &&
            (filterStore.filter.type === "and" ||
              filterStore.filter.type === "or") &&
            filterStore.filter.expressions.length > 0 && (
              <Badge variant="outline" className="ml-2">
                Active
              </Badge>
            )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={
              !filterStore.filter ||
              ((filterStore.filter.type === "and" ||
                filterStore.filter.type === "or") &&
                filterStore.filter.expressions.length === 0)
            }
          >
            <Save size={16} className="mr-1" />
            Save Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => filterStore.setFilter(DEFAULT_FILTER)}
          >
            <X size={16} className="mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <P>Loading filter options...</P>
        </div>
      ) : (
        <div className="space-y-4">
          {filterStore.filter &&
          (filterStore.filter.type === "and" ||
            filterStore.filter.type === "or") ? (
            renderGroup(filterStore.filter, [], filterDefinitions)
          ) : (
            <div className="text-center py-8">
              <P className="text-muted-foreground">No filters applied</P>
              <Button
                onClick={() => handleAddGroup([], "and")}
                className="mt-2"
                variant="default"
              >
                <PlusCircle size={16} className="mr-1" />
                Add Filter Group
              </Button>
            </div>
          )}

          {filterStore.savedFilters.length > 0 && (
            <div className="mt-4">
              <H4 className="mb-2">Saved Filters</H4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filterStore.savedFilters.map((savedFilter) => (
                  <div
                    key={savedFilter.id}
                    className="p-2 border rounded cursor-pointer hover:bg-accent"
                    onClick={() => handleLoadFilter(savedFilter.id)}
                  >
                    <P>{savedFilter.name}</P>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give your filter a name to save it for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Filter name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DEFAULT_FILTER: AndExpression = {
  type: "and",
  expressions: [],
};

export default FilterASTEditor;
