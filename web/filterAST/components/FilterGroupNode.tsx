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
import { Small } from "@/components/ui/typography";
import { Plus, PlusCircle, Trash2 } from "lucide-react";
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
    filterStore.addFilterExpression(path, {
      type: "condition",
      field: {
        column: "status",
      },
      operator: "eq",
      value: 200,
    });
  };

  // Handle adding a nested group to this group
  const handleAddGroup = (groupType: "and" | "or") => {
    // Use status as the default field (common and useful default)
    const defaultField = "status";
    const defaultFieldDef = filterDefinitions.find(
      (def) => def.id === defaultField
    );

    // If status field is found, use its first operator, otherwise fallback to eq
    const defaultOperator = defaultFieldDef?.operators[0] || "eq";

    // Create a new group with a default condition already included
    filterStore.addFilterExpression(path, {
      type: groupType,
      expressions: [
        {
          type: "condition",
          field: {
            column: defaultField,
            subtype: defaultFieldDef?.subType,
          },
          operator: defaultOperator,
          value: "",
        },
      ],
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
    <div
      className={` rounded-md bg-white dark:bg-slate-950${
        isRoot
          ? "bg-transparent"
          : " p-2  border border-slate-200 dark:border-slate-800 "
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            asPill
            onClick={handleToggleGroupOperator}
            className={`min-w-[40px] px-2 py-0 h-5 text-[10px] flex items-center ${
              group.type === "and"
                ? "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-800 dark:hover:bg-sky-800"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            {group.type === "and" ? "AND" : "OR"}
          </Button>
          <div className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full px-2 h-5 flex items-center">
            {group.expressions.length}{" "}
            {group.expressions.length === 1 ? "condition" : "conditions"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {path.length === 0 ? (
            <Button
              variant="secondary"
              size="xs"
              className="flex items-center gap-1"
              onClick={() => handleAddGroup("and")}
            >
              <PlusCircle size={12} />
              <span className="text-[10px] font-normal">Add Filter Group</span>
            </Button>
          ) : undefined}
          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-6 w-6"
            >
              <Trash2 size={12} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className={`space-y-1.5 ${isRoot ? "" : "pl-3"}`}>
        {group.expressions.length === 0 ? (
          <Small className="text-muted-foreground py-1.5 block">
            No conditions. Click &quot;Add&quot; to create one.
          </Small>
        ) : (
          group.expressions.map((expr, index) => {
            const newPath = [...path, index];
            if (expr.type === "and" || expr.type === "or") {
              return (
                <div key={`group-${index}`} className="mt-1.5">
                  <FilterGroupNode
                    group={expr as AndExpression | OrExpression}
                    path={newPath}
                  />
                </div>
              );
            } else if (expr.type === "condition") {
              // Check if this is the only condition in the group
              const isOnlyCondition = group.expressions.length === 1;

              return (
                <div key={`condition-${index}`}>
                  <FilterConditionNode
                    condition={expr}
                    path={newPath}
                    isOnlyCondition={isOnlyCondition}
                  />
                </div>
              );
            }
            return null;
          })
        )}

        {/* Quick add button - show at all levels */}
        <div className="flex justify-start mt-1">
          <Button
            variant="glass"
            onClick={handleAddCondition}
            size="sm_sleek"
            className="flex items-center gap-1"
          >
            <Plus size={10} />
            <span className="text-[10px] font-normal">Add Condition</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterGroupNode;
