import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FilterASTEditor } from "./FilterASTEditor";
import { useFilterAST } from "./context/filterContext";
import { Badge } from "@/components/ui/badge";
import { Row } from "@/components/layout/common";

interface FilterASTButtonProps {}

export const FilterASTButton: React.FC<FilterASTButtonProps> = ({}) => {
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

  return (
    <Row>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {!isOpen && store.activeFilterId && (
              <Badge variant="outline" className="text-xs">
                {store.activeFilterName}
              </Badge>
            )}
            {!isOpen &&
              !store.activeFilterId &&
              store.getFilterNodeCount() > 0 && (
                <Badge variant="default" className="text-xs">
                  {store.getFilterNodeCount()}
                </Badge>
              )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto min-w-[800px] max-w-[90vw] p-0">
          <FilterASTEditor />
        </PopoverContent>
      </Popover>
      {store.getFilterNodeCount() > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            store.clearActiveFilter();
          }}
        >
          Clear
        </Button>
      )}
    </Row>
  );
};

export default FilterASTButton;
