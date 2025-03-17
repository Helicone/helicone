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
  Share2,
  Link,
  Clock,
  Info,
} from "lucide-react";
import React, { useState } from "react";
import { AndExpression, FilterExpression } from "./filterAst";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
      updateFilterName,
      clearFilter,
    },
    helpers,
  } = useFilterAST();
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState(
    filterStore.activeFilterId
      ? crud.savedFilters.find(
          (filter) => filter.id === filterStore.activeFilterId
        )?.name
      : "Untitled Filter"
  );

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

  if (crud.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full bg-white dark:bg-slate-950 rounded-md p-3">
      <div className="flex items-center justify-between">
        <div className="flex  flex-col items-center gap-1.5">
          <div className="border-b pb-2">
            <Input
              value={filterStore.activeFilterName || "Untitled Filter"}
              onChange={(e) => updateFilterName(e.target.value)}
              className="text-sm font-medium border-none p-0 h-auto w-full focus-visible:ring-0"
              placeholder="Untitled Filter"
            />
          </div>

          {filterStore.activeFilterName === "Untitled Filter" && (
            <Small className="text-muted-foreground text-[10px] font-normal flex gap-1 items-center">
              <Info size={12} className="mr-1" />
              Change the name to save
            </Small>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {filterStore.hasUnsavedChanges && (
            <div className="flex items-center text-muted-foreground bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-800">
              <Clock size={10} className="mr-1" />
              Saving
            </div>
          )}
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
            <span className="text-[10px] font-normal">New</span>
          </Button>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                disabled={!filterStore.activeFilterId}
              >
                <Share2 size={12} className="mr-1" />

                <span className="text-[10px] font-normal">Share</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Filter</DialogTitle>
                <DialogDescription>
                  Copy this URL to share your filter with others
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 mt-4">
                <Input value={helpers.getShareableUrl() || ""} readOnly />
                <Button onClick={handleCopyShareableUrl}>
                  <Link size={16} className="mr-1" />
                  Copy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  setFilterName("");
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
