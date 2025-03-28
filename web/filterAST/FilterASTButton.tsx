import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import React from "react";
import { FilterASTEditor } from "./FilterASTEditor";

interface FilterASTButtonProps {}

export const FilterASTButton: React.FC<FilterASTButtonProps> = ({}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[800px] max-w-[90vw] p-0">
        <FilterASTEditor />
      </PopoverContent>
    </Popover>
  );
};

export default FilterASTButton;
