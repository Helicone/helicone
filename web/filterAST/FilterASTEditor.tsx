import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { H4, P } from "@/components/ui/typography";
import { Filter as FilterIcon, PlusCircle, Save, X } from "lucide-react";
import React from "react";
import { AndExpression, FilterExpression } from "./filterAst";
import { useFilterStore } from "./store/filterStore";

// Import components
import FilterGroupNode from "./components/FilterGroupNode";
import SaveFilterDialog from "./components/SaveFilterDialog";
import SavedFiltersList from "./components/SavedFiltersList";

// Import hooks
import { useFilterActions } from "./hooks/useFilterActions";

// Define a default filter structure
const DEFAULT_FILTER: AndExpression = {
  type: "and",
  expressions: [],
};

interface FilterASTEditorProps {
  onFilterChange?: (filter: FilterExpression) => void;
  layoutPage?: "dashboard" | "requests";
}

export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  onFilterChange,
  layoutPage = "requests",
}) => {
  const filterStore = useFilterStore();
  const { saveDialogOpen, setSaveDialogOpen, hasActiveFilters, clearFilter } =
    useFilterActions();

  // Call the onFilterChange callback whenever the filter changes
  React.useEffect(() => {
    if (onFilterChange && filterStore.filter) {
      onFilterChange(filterStore.filter);
    }
  }, [filterStore.filter, onFilterChange]);

  // Create the root if it doesn't exist
  if (!filterStore.filter) {
    filterStore.setFilter(DEFAULT_FILTER);
  }

  // Create a new filter group when none exists
  const handleAddFilterGroup = () => {
    filterStore.setFilter({
      type: "and",
      expressions: [],
    });
  };

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
              onClick={handleAddFilterGroup}
              className="mt-2"
              variant="default"
            >
              <PlusCircle size={16} className="mr-1" />
              Add Filter Group
            </Button>
          </div>
        )}

        {/* Display saved filters */}
        <SavedFiltersList />
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
