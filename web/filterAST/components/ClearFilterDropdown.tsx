import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";

interface ClearFilterDropdownProps {
  onConfirm: () => void;
  hasActiveFilters: boolean;
}

export const ClearFilterDropdown: React.FC<ClearFilterDropdownProps> = ({
  onConfirm,
  hasActiveFilters,
}) => {
  const [open, setOpen] = useState(false);

  // If there are no active filters, just render a simple button
  if (!hasActiveFilters) {
    return (
      <Button variant="ghost" size="xs" onClick={onConfirm}>
        <X size={12} className="mr-1" />
        <span className="text-[10px] font-normal">Clear</span>
      </Button>
    );
  }

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xs">
          <X size={12} className="mr-1" />
          <span className="text-[10px] font-normal">Clear</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-amber-500 dark:text-amber-400 mb-1">
            <AlertTriangle size={14} className="mr-2" />
            <span className="text-xs font-medium">Clear filter?</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            This will remove all conditions from your current filter. This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-1">
            <Button
              variant="outline"
              size="xs"
              className="h-7"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="xs"
              className="h-7"
              onClick={handleConfirm}
            >
              Clear
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClearFilterDropdown;
