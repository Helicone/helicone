import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Small } from "@/components/ui/typography";
import {
  PlusCircle,
  Save,
  X,
  BookOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import React, { useState } from "react";
import { AndExpression, FilterExpression } from "./filterAst";

// Import components
import FilterGroupNode from "./components/FilterGroupNode";
import SaveFilterDialog from "./components/SaveFilterDialog";
import SavedFiltersList from "./components/SavedFiltersList";

// Import hooks
import { useFilterAST } from "./context/filterContext";

// Define a default filter structure
const DEFAULT_FILTER: AndExpression = {
  type: "and",
  expressions: [
    {
      type: "condition",
      field: { column: "status" },
      operator: "eq",
      value: "",
    },
  ],
};

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
      clearFilter,
    },
    helpers,
  } = useFilterAST();
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  // Call the onFilterChange callback whenever the filter changes
  React.useEffect(() => {
    if (onFilterChange && filterStore.filter) {
      onFilterChange(filterStore.filter);
    }
  }, [filterStore.filter, onFilterChange]);

  // Toggle saved filters visibility
  const toggleSavedFilters = () => {
    setShowSavedFilters(!showSavedFilters);
  };

  if (crud.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full bg-white dark:bg-slate-950 rounded-md p-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="xs" onClick={toggleSavedFilters}>
            <BookOpen size={12} className="mr-1" />
            <span className="text-[10px] font-normal">
              {showSavedFilters ? "Hide" : "Saved"}
            </span>
            {!showSavedFilters && crud.savedFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1 py-0 h-3.5 text-[10px] font-normal"
              >
                {crud.savedFilters.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasActiveFilters()}
          >
            <Save size={12} className="mr-1" />
            <span className="text-[10px] font-normal">Save</span>
          </Button>
          <Button variant="ghost" size="xs" onClick={clearFilter}>
            <X size={12} className="mr-1" />
            <span className="text-[10px] font-normal">Clear</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => helpers.newEmptyFilter()}
          >
            <RefreshCw size={12} className="mr-1" />
            <span className="text-[10px] font-normal">Reset</span>
          </Button>
        </div>
      </div>

      {/* Main filter content */}
      <div className="space-y-2">
        {filterStore.filter &&
        (filterStore.filter.type === "and" ||
          filterStore.filter.type === "or") ? (
          <FilterGroupNode group={filterStore.filter} path={[]} isRoot={true} />
        ) : (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 rounded-md">
            <Small className="text-muted-foreground text-[10px] font-normal">
              No filters applied
            </Small>
            <div className="mt-2">
              <Button
                onClick={() => {
                  helpers.newEmptyFilter();
                }}
                variant="default"
                size="xs"
              >
                <PlusCircle size={12} className="mr-1" />
                <span className="text-[10px] font-normal">New Filter</span>
              </Button>
            </div>
          </div>
        )}

        {/* Display saved filters */}
        {showSavedFilters && (
          <div className="mt-2 border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
            <Small className="font-normal text-[10px] mb-2 block">
              Saved Filters
            </Small>
            <SavedFiltersList onClose={() => setShowSavedFilters(false)} />
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
