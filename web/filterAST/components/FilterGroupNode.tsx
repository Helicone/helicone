import React from "react";
import { AndExpression, OrExpression } from "../filterAst";
import { useFilterStore } from "../store/filterStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { P, Small } from "@/components/ui/typography";
import { PlusCircle, Trash2 } from "lucide-react";
import FilterConditionNode from "./FilterConditionNode";
import { useFilterUIDefinitions } from "../filterUIDefinitions/useFilterUIDefinitions";

interface FilterGroupNodeProps {
  group: AndExpression | OrExpression;
  path: number[];

  isRoot?: boolean;
}

export const FilterGroupNode: React.FC<FilterGroupNodeProps> = ({
  group,
  path,

  isRoot = false,
}) => {
  const filterStore = useFilterStore();
  const { filterDefinitions } = useFilterUIDefinitions();

  // Handle adding a new condition to this group with a sensible default
  const handleAddCondition = () => {
    // Use status as the default field (common and useful default)
    const defaultField = "status";
    const defaultFieldDef = filterDefinitions.find(
      (def) => def.id === defaultField
    );

    // If status field is found, use its first operator, otherwise fallback to eq
    const defaultOperator = defaultFieldDef?.operators[0] || "eq";

    filterStore.addFilterExpression(path, {
      type: "condition",
      field: {
        column: defaultField,
        subtype: defaultFieldDef?.subType,
      },
      operator: defaultOperator,
      value: "",
    });
  };

  // Handle adding a nested group to this group
  const handleAddGroup = (groupType: "and" | "or") => {
    filterStore.addFilterExpression(path, {
      type: groupType,
      expressions: [],
    });
  };

  // Handle toggling the operator of this group (AND/OR)
  const handleToggleGroupOperator = () => {
    if (group.type === "and") {
      const updated: OrExpression = {
        type: "or",
        expressions: [...group.expressions],
      };
      filterStore.updateFilterExpression(path, updated);
    } else {
      const updated: AndExpression = {
        type: "and",
        expressions: [...group.expressions],
      };
      filterStore.updateFilterExpression(path, updated);
    }
  };

  // Handle removing this group
  const handleRemove = () => {
    filterStore.removeFilterExpression(path);
  };

  return (
    <div className="p-3 border rounded-md bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm_sleek"
            asPill
            onClick={handleToggleGroupOperator}
            className={`min-w-[50px] px-3 py-0.5 text-xs font-medium ${
              group.type === "and"
                ? "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-800"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            {group.type === "and" ? "AND" : "OR"}
          </Button>
          <Small className="text-muted-foreground">
            {group.expressions.length}{" "}
            {group.expressions.length === 1 ? "condition" : "conditions"}
          </Small>
        </div>
        <div className="flex items-center gap-2">
          {path.length === 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <PlusCircle size={16} className="mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleAddCondition}>
                  Add Condition
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddGroup("and")}>
                  Add AND Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddGroup("or")}>
                  Add OR Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleAddCondition}>
              <PlusCircle size={16} className="mr-1" />
              Add Condition
            </Button>
          )}
          {!isRoot && (
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <Trash2 size={16} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="pl-4 space-y-2">
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
                  <FilterGroupNode
                    group={expr as AndExpression | OrExpression}
                    path={newPath}
                  />
                </div>
              );
            } else if (expr.type === "condition") {
              return (
                <div key={`condition-${index}`}>
                  <FilterConditionNode condition={expr} path={newPath} />
                </div>
              );
            }
            return null;
          })
        )}

        {/* Quick add button - show at all levels */}
        <div className="flex justify-center mt-1">
          <Button
            variant="ghost"
            size="sm_sleek"
            onClick={handleAddCondition}
            className="h-6 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md px-2 py-1"
          >
            <PlusCircle size={12} className="mr-1.5" />
            Add condition
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterGroupNode;
