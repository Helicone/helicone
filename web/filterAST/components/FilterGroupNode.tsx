import React from "react";
import { AndExpression, OrExpression } from "../filterAst";
import { FilterUIDefinition } from "../filterUIDefinitions/types";
import { useFilterStore } from "../store/filterStore";
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

  // Handle adding a new condition to this group
  const handleAddCondition = () => {
    filterStore.addFilterExpression(path, {
      type: "condition",
      field: { column: "" },
      operator: "eq",
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

  // Handle changing the operator of this group (AND/OR)
  const handleGroupOperatorChange = (newType: "and" | "or") => {
    const updated = { ...group, type: newType };
    filterStore.updateFilterExpression(path, updated);
  };

  // Handle removing this group
  const handleRemove = () => {
    filterStore.removeFilterExpression(path);
  };

  return (
    <div className="p-3 border rounded-md bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Select
            value={group.type}
            onValueChange={(value) =>
              handleGroupOperatorChange(value as "and" | "or")
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
          {!isRoot && (
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <Trash2 size={16} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

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
      </div>
    </div>
  );
};

export default FilterGroupNode;
