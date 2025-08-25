import { Button } from "@/components/ui/button";
import { Small, XSmall } from "@/components/ui/typography";
import { ChevronsUpDown, Plus } from "lucide-react";
import React, { useMemo } from "react";
import {
  AndExpression,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  FilterAST,
  OrExpression,
} from "@helicone-package/filters";
import { useFilterStore } from "../store/filterStore";
import FilterConditionNode from "./FilterConditionNode";
import { Row } from "@/components/layout/common/row";
import SaveFilterButton from "./SaveFilterButton";

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

  // Handle adding a new condition to this group with a sensible default
  const handleAddCondition = () => {
    filterStore.addFilterExpression(path, {
      type: "condition",
      field: {
        column: "status",
        table: "request_response_rmt",
      },
      operator: "eq",
      value: 200,
    });
  };

  const hasGroupAlready = useMemo(() => {
    return group.expressions.find(
      (expr) => expr.type === "and" || expr.type === "or",
    );
  }, [group]);
  // Handle adding a nested group to this group
  const handleAddGroup = () => {
    if (hasGroupAlready) {
      group.expressions.push(DEFAULT_FILTER_GROUP_EXPRESSION);
      filterStore.setFilter(group);
    } else {
      filterStore.setFilter(
        FilterAST.and(group, DEFAULT_FILTER_GROUP_EXPRESSION),
      );
    }
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

  return (
    <div className={`rounded-md bg-transparent ${isRoot ? "" : "border p-4"}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <XSmall className="font-normal">Match</XSmall>

          <Button
            size="sm_sleek"
            onClick={handleToggleGroupOperator}
            variant={"secondary"}
            className="gap-1 border px-3"
          >
            <XSmall className="font-normal">
              {group.type === "and" ? "All" : "Any"}
            </XSmall>
            <ChevronsUpDown className="opacity-50" size={12} />
          </Button>
          <XSmall className="font-normal">
            {isRoot ? "groups" : "conditions in this group"}
          </XSmall>
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${isRoot ? "" : ""}`}>
        <div className="flex flex-col gap-0">
          {group.expressions.length === 0 ? (
            <Small className="block py-1.5 text-muted-foreground">
              No conditions. Click &quot;Add&quot; to create one.
            </Small>
          ) : (
            group.expressions.map((expr, index) => {
              const newPath = [...path, index];
              if (expr.type === "and" || expr.type === "or") {
                const isLast = index === group.expressions.length - 1;
                return (
                  <div key={`group-${index}`} className="mt-1.5">
                    <FilterGroupNode
                      group={expr as AndExpression | OrExpression}
                      path={newPath}
                    />
                    {!isLast && (
                      <XSmall className="font-normal text-slate-400">
                        {group.type === "and" ? "And" : "Or"}
                      </XSmall>
                    )}
                  </div>
                );
              } else if (expr.type === "condition") {
                return (
                  <div key={`condition-${index}`}>
                    <FilterConditionNode
                      condition={expr}
                      path={newPath}
                      isFirst={index === 0}
                      isLast={index === group.expressions.length - 1}
                    />
                  </div>
                );
              }
              return null;
            })
          )}
        </div>

        {(!isRoot || !hasGroupAlready) && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={handleAddCondition}
              size="sm_sleek"
              className="flex gap-1 px-0"
            >
              <Plus size={10} />
              <span className="text-[10px] font-normal">Add Condition</span>
            </Button>
          </div>
        )}

        {isRoot && (
          <Row className="w-full justify-between">
            <Button
              variant="glass"
              size="xs"
              className="flex w-fit items-center gap-1"
              onClick={() => handleAddGroup()}
            >
              <Plus size={12} />
              <span className="text-[10px] font-normal">
                Add Condition Group
              </span>
            </Button>
            <SaveFilterButton />
          </Row>
        )}
      </div>
    </div>
  );
};

export default FilterGroupNode;
