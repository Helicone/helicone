import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link, Plus, Share2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  AndExpression,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  FilterExpression,
  OrExpression,
} from "./filterAst";

// Import components
import ClearFilterDropdown from "./components/ClearFilterDropdown";
import FilterGroupNode from "./components/FilterGroupNode";
import SavedFiltersDropdown from "./components/SavedFiltersDropdown";
import SaveFilterDialog from "./components/SaveFilterDialog";

// Import hooks
import { useFilterAST } from "./context/filterContext";

interface FilterASTEditorProps {
  onFilterChange?: (filter: FilterExpression) => void;
}

export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  onFilterChange,
}) => {
  const {
    crud,
    store: filterStore,
    actions: {
      saveDialogOpen,
      setSaveDialogOpen,
      hasActiveFilters,
      updateFilterName,
    },
    helpers,
  } = useFilterAST();

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Call the onFilterChange callback whenever the filter changes
  React.useEffect(() => {
    if (onFilterChange && filterStore.filter) {
      onFilterChange(filterStore.filter);
    }
  }, [filterStore.filter, onFilterChange]);

  // Handler for copying the shareable URL
  const handleCopyShareableUrl = () => {
    const url = helpers.getShareableUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("URL copied", {
        description: "Shareable filter URL has been copied to clipboard.",
      });
      setIsShareDialogOpen(false);
    }
  };

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
                    updateFilterName(e.target.value);
                  }}
                  className="text-sm font-medium border-none p-0 h-auto min-h-[24px] min-w-[120px] w-full focus-visible:ring-0 bg-transparent"
                  placeholder="Untitled Filter"
                />
                {(crud.isRefetching || crud.isSaving) && (
                  <div className="flex items-center text-muted-foreground bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-800">
                    Saving...
                  </div>
                )}
                {filterStore.hasUnsavedChanges &&
                !(crud.isRefetching || crud.isSaving) ? (
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
                  <Button variant="ghost" size="square_icon">
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

      {/* Save filter dialog */}
      <SaveFilterDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
      />
    </div>
  );
};

export default FilterASTEditor;
