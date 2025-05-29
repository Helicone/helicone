import { Row } from "@/components/layout/common/row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import React from "react";
import FilterGroupNode from "./components/FilterGroupNode";
import SavedFiltersDropdown from "./components/SavedFiltersDropdown";
import { useFilterAST } from "./context/filterContext";
import {
  AndExpression,
  createDefaultFilterGroupExpressionForTable,
  OrExpression,
} from "./filterAst";
import { RequestResponseRMTDerivedTable } from "./filterAst";

interface FilterASTEditorProps {
  baseTable?: RequestResponseRMTDerivedTable;
}


// Editor for filters of request_response_rmt, and extensions.
// Extensions referring to tables that are derived from request_response_rmt, such as session_rmt.
// But can add additional filters for aggregations or reformations of the base RMT table.
export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  baseTable = "request_response_rmt",
}) => {
  const { store: filterStore, helpers } = useFilterAST();

  return (
    <div className="space-y-3 w-full bg-background rounded-md py-4 px-6">
      <div className="flex items-center justify-between ">
        <div className="flex flex-col items-center gap-1.5">
          {filterStore.activeFilterName !== null && (
            <div className="flex items-center gap-1 group border-b border-dotted border-transparent hover:border-gray-300 dark:hover:border-slate-600">
              <Input
                value={filterStore.activeFilterName}
                onChange={(e) => {
                  filterStore.setActiveFilterName(e.target.value);
                }}
                disabled={filterStore.filter === null}
                className="text-sm font-medium border-none p-0 h-auto min-h-[24px] w-fit focus-visible:ring-0 bg-transparent"
                placeholder="Untitled Filter"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Row className="gap-1 items-center">
            {filterStore.getFilterNodeCount() > 0 && (
              <Badge
                variant="default"
                className="text-xs text-center hover:bg-primary hover:text-primary-foreground"
              >
                {filterStore.getFilterNodeCount()}
              </Badge>
            )}
            {filterStore.filter !== null && (
              <Button variant="ghost" size="xs" onClick={helpers.clearFilter}>
                Clear
              </Button>
            )}
          </Row>
          <SavedFiltersDropdown />
        </div>
      </div>

      <div className="space-y-2">
        {filterStore.filter ? (
          <FilterGroupNode
            group={filterStore.filter as AndExpression | OrExpression}
            path={[]}
            isRoot={true}
            baseTable={baseTable}
          />
        ) : (
          <Button
            variant="glass"
            size="xs"
            className="flex items-center gap-1 w-fit"
            onClick={() => {
              filterStore.setFilter(createDefaultFilterGroupExpressionForTable(baseTable));
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
