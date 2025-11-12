import { Row } from "@/components/layout/common/row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import React from "react";
import FilterGroupNode from "./components/FilterGroupNode";
import { useFilterAST } from "./context/filterContext";
import {
  AndExpression,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  OrExpression,
} from "@helicone-package/filters/types";

interface FilterASTEditorProps {
  showCurlButton?: boolean;
}

export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({ showCurlButton = false }) => {
  const { store: filterStore, helpers } = useFilterAST();

  return (
    <div className="w-full space-y-3 rounded-md bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1.5">
          {filterStore.activeFilterName !== null && (
            <div className="group flex items-center gap-1 border-b border-dotted border-transparent hover:border-gray-300 dark:hover:border-slate-600">
              <Input
                value={filterStore.activeFilterName}
                onChange={(e) => {
                  filterStore.setActiveFilterName(e.target.value);
                }}
                disabled={filterStore.filter === null}
                className="h-auto min-h-[24px] w-fit border-none bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                placeholder="Untitled Filter"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Row className="items-center gap-1">
            {filterStore.getFilterNodeCount() > 0 && (
              <Badge
                variant="default"
                className="text-center text-xs hover:bg-primary hover:text-primary-foreground"
              >
                {filterStore.getFilterNodeCount()}
              </Badge>
            )}
            {filterStore.filter !== null && (
              <Button type="button" variant="ghost" size="xs" onClick={helpers.clearFilter}>
                Clear
              </Button>
            )}
          </Row>
        </div>
      </div>

      <div className="space-y-2">
        {filterStore.filter ? (
          <FilterGroupNode
            group={filterStore.filter as AndExpression | OrExpression}
            path={[]}
            isRoot={true}
            showCurlButton={showCurlButton}
          />
        ) : (
          <Button
            type="button"
            variant="glass"
            size="xs"
            className="flex w-fit items-center gap-1"
            onClick={() => {
              filterStore.setFilter(DEFAULT_FILTER_GROUP_EXPRESSION);
              filterStore.setActiveFilterName("Untitled Filter");
            }}
          >
            <Plus size={12} />
            <span className="text-[10px] font-normal">Add Condition Group</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterASTEditor;
