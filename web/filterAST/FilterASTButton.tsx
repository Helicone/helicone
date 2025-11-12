import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FilterASTEditor } from "./FilterASTEditor";
import { useFilterAST } from "./context/filterContext";
import { Badge } from "@/components/ui/badge";
import { Row } from "@/components/layout/common";
import SavedFiltersDropdown from "./components/SavedFiltersDropdown";

interface FilterASTButtonProps {
  showCurlButton?: boolean;
}

export const FilterASTButton: React.FC<FilterASTButtonProps> = ({ showCurlButton = false }) => {
  const { store } = useFilterAST();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Wait for hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't render anything while hydrating to prevent mismatch
  if (!isHydrated) {
    return (
      <Button variant="outline" size="sm" className="gap-2">
        <Filter className="h-4 w-4" />
        Filter
      </Button>
    );
  }

  const numFilters = store.getFilterNodeCount();

  return (
    <Row className="space-x-2 mr-4">
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={numFilters > 0 ? "default" : "outline"}
            className="gap-2"
            size="sm"
          >
            <Filter size={14} />
            {numFilters > 0 ? (
              <>
                Filters
                <Badge className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900 hover:bg-white/90 p-0">
                  {numFilters}
                </Badge>
              </>
            ) : (
              "Filter"
            )}
            {!isOpen && store.activeFilterId && (
              <Badge variant="outline" className="text-xs">
                {store.activeFilterName}
              </Badge>
            )}
            {numFilters > 0 && (
              <X
                size={14}
                className="ml-1 hover:opacity-70 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  store.clearActiveFilter();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto min-w-[800px] max-w-[90vw] p-0">
          <FilterASTEditor showCurlButton={showCurlButton} />
        </PopoverContent>
      </Popover>
      <SavedFiltersDropdown />
    </Row>
  );
};

export default FilterASTButton;
