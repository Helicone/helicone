import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Plus } from "lucide-react";
import React from "react";
import FilterGroupNode from "./components/FilterGroupNode";
import SavedFiltersDropdown from "./components/SavedFiltersDropdown";

import { useFilterAST } from "./context/filterContext";
import {
  AndExpression,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  OrExpression,
} from "./filterAst";
import { usePathname } from "next/navigation";
import useNotification from "@/components/shared/notification/useNotification";

interface FilterASTEditorProps {}

export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({}) => {
  const {
    crud,
    store: filterStore,

    helpers,
  } = useFilterAST();
  const pathname = usePathname();
  const notification = useNotification();

  return (
    <div className="space-y-3 w-full bg-background rounded-md py-4 px-6">
      {filterStore.filter && (
        <div className="flex items-center justify-between ">
          <div className="flex flex-col items-center gap-1.5">
            {filterStore.activeFilterName !== null && (
              <div className="flex items-center gap-1">
                <Input
                  value={filterStore.activeFilterName}
                  onChange={(e) => {
                    filterStore.setActiveFilterName(e.target.value);
                  }}
                  className="text-sm font-medium border-none p-0 h-auto min-h-[24px] min-w-[120px] w-full focus-visible:ring-0 bg-transparent"
                  placeholder="Untitled Filter"
                />
                {crud.isRefetching || crud.isSaving ? (
                  <div className="flex items-center text-muted-foreground bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-800">
                    Saving...
                  </div>
                ) : !filterStore.activeFilterId ? (
                  <Button
                    variant="outline"
                    size="sm_sleek"
                    onClick={() => {
                      helpers.saveFilter();
                    }}
                    className="text-[10px] font-normal"
                  >
                    Save New
                  </Button>
                ) : filterStore.hasUnsavedChanges ? (
                  <Button
                    variant="outline"
                    size="sm_sleek"
                    onClick={() => {
                      if (filterStore.activeFilterId) {
                        helpers.updateFilterById(filterStore.activeFilterId, {
                          filter: filterStore.filter,
                          name:
                            filterStore.activeFilterName || "Untitled Filter",
                        });
                      }
                    }}
                    className="text-[10px] font-normal"
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="square_icon"
                    onClick={() => {
                      const url = helpers.getShareableUrl();
                      if (url) {
                        navigator.clipboard.writeText(url);
                        notification.setNotification(
                          "Filter URL copied to clipboard",
                          "success"
                        );
                      }
                    }}
                  >
                    <Link size={12} />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="xs" onClick={helpers.clearFilter}>
              Clear
            </Button>
            <SavedFiltersDropdown />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filterStore.filter ? (
          <FilterGroupNode
            group={filterStore.filter as AndExpression | OrExpression}
            path={[]}
            isRoot={true}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                filterStore.setFilter(DEFAULT_FILTER_GROUP_EXPRESSION);
                filterStore.setActiveFilterName("Untitled Filter");
              }}
            >
              <Plus size={16} />
              <span>Add Condition Group</span>
            </Button>
            <SavedFiltersDropdown />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterASTEditor;
