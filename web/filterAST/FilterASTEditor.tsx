import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { H4, P } from "@/components/ui/typography";
import {
  Filter as FilterIcon,
  PlusCircle,
  Save,
  X,
  BookOpen,
  Loader2,
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
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon size={20} />
          <H4>Filters</H4>
          {hasActiveFilters() && (
            <Badge variant="outline" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleSavedFilters}>
            <BookOpen size={16} className="mr-1" />
            {showSavedFilters ? "Hide Saved" : "Saved Filters"}
            {!showSavedFilters && crud.savedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {crud.savedFilters.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasActiveFilters()}
          >
            <Save size={16} className="mr-1" />
            Save Filter
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilter}>
            <X size={16} className="mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Main filter content */}
      <div className="space-y-4">
        {filterStore.filter &&
        (filterStore.filter.type === "and" ||
          filterStore.filter.type === "or") ? (
          <FilterGroupNode group={filterStore.filter} path={[]} isRoot={true} />
        ) : (
          <div className="text-center py-8">
            <P className="text-muted-foreground">No filters applied</P>
            <Button
              onClick={() => {
                helpers.newEmptyFilter();
              }}
              className="mt-2"
              variant="default"
            >
              <PlusCircle size={16} className="mr-1" />
              New Filter
            </Button>
          </div>
        )}

        {/* Display saved filters */}
        {showSavedFilters && (
          <div className="mt-4 border rounded-md p-4 bg-card">
            <H4 className="mb-2">Saved Filters</H4>
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
