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
import { Small } from "@/components/ui/typography";
import {
  Clock,
  Info,
  Link,
  Loader2,
  Plus,
  PlusCircle,
  RefreshCw,
  Share2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  AndExpression,
  F,
  OrExpression,
  OrExpressionilterExpression,
} from "./filterAst";

// Import components
import FilterGroupNode from "./components/FilterGroupNode";
import SaveFilterDialog from "./components/SaveFilterDialog";
import ClearFilterDropdown from "./components/ClearFilterDropdown";
import SavedFiltersDropdown from "./components/SavedFiltersDropdown";

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
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

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
      {filterStore.filter && (
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex flex-col items-center gap-1.5">
            {filterStore.activeFilterName !== null && (
              <div className="flex items-center gap-1">
                <Input
                  value={filterStore.activeFilterName}
                  onChange={(e) => {
                    updateFilterName(e.target.value);
                  }}
                  className="text-sm font-medium border-none p-0 h-auto min-h-[24px] min-w-[120px] w-full focus-visible:ring-0"
                  placeholder="Untitled Filter"
                />
                {filterStore.hasUnsavedChanges && (
                  <div className="flex items-center text-muted-foreground bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-800">
                    Saving...
                  </div>
                )}
                {filterStore.activeFilterName === "Untitled Filter" && (
                  <Small className="text-muted-foreground text-[10px] font-normal flex gap-1 items-center text-nowrap">
                    <Info size={12} className="mr-1" />
                    Change the name to save
                  </Small>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="glass"
                  size="xs"
                  disabled={!filterStore.activeFilterId}
                >
                  <Share2 size={12} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Filter</DialogTitle>
                  <DialogDescription>
                    Copy the URL below to share this filter with others.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <Input
                    value={helpers.getShareableUrl() || ""}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShareableUrl}
                  >
                    <Link size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <ClearFilterDropdown
              onConfirm={helpers.clearFilter}
              hasActiveFilters={hasActiveFilters()}
            />

            <SavedFiltersDropdown
              showSavedFilters={showSavedFilters}
              toggleSavedFilters={toggleSavedFilters}
            />

            <Button
              variant="glass"
              size="xs"
              onClick={() => helpers.newEmptyFilter()}
            >
              <Plus size={12} />
              <span className="text-[10px] font-normal">New Filter</span>
            </Button>
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
          <div className="text-center py-6 rounded-md flex flex-col items-center gap-2">
            <Small className="text-muted-foreground text-[10px] font-normal">
              No filters applied
            </Small>
            <div className="flex items-center gap-2">
              <SavedFiltersDropdown
                showSavedFilters={showSavedFilters}
                toggleSavedFilters={toggleSavedFilters}
              />
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
