import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Small } from "@/components/ui/typography";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface SavedFiltersDropdownProps {}

export const SavedFiltersDropdown: React.FC<
  SavedFiltersDropdownProps
> = ({}) => {
  const [open, setOpen] = useState(false);
  const { crud, helpers, store } = useFilterAST();

  const handleSelectFilter = (filterId: string) => {
    helpers.loadFilterById(filterId);
    setOpen(false);
  };

  const handleDeleteFilter = (e: React.MouseEvent, filterId: string) => {
    e.stopPropagation();
    helpers.deleteFilter(filterId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="flex items-center gap-2 text-xs"
        >
          <span>Saved Filters</span>
          {crud.savedFilters.length > 0 && (
            <Badge
              variant="helicone"
              className="border-none bg-slate-200 dark:bg-slate-800"
            >
              {crud.savedFilters.length}
            </Badge>
          )}
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <Small className="font-medium text-xs">Saved Filters</Small>
        </div>
        <DropdownMenuSeparator />

        {crud.isLoading ? (
          <div className="p-2 text-center">
            <Small className="text-muted-foreground">Loading...</Small>
          </div>
        ) : crud.savedFilters.length === 0 ? (
          <div className="p-2 text-center">
            <Small className="text-muted-foreground">No saved filters</Small>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto py-1">
            {crud.savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex justify-between items-center px-2 py-2 cursor-pointer"
                onClick={() => handleSelectFilter(filter.id || "")}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{filter.name}</span>
                  <Small className="text-muted-foreground text-[10px]">
                    {filter.createdAt
                      ? new Date(filter.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </Small>
                </div>
                <div className="flex items-center gap-1">
                  {store.activeFilterId === filter.id && (
                    <Check size={14} className="text-primary" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-destructive/10"
                    onClick={(e) => handleDeleteFilter(e, filter.id || "")}
                    disabled={crud.isDeleting}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SavedFiltersDropdown;
