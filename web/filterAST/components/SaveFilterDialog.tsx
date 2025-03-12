import React, { useState } from "react";
import { useFilterStore } from "../store/filterStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSavedFilters } from "@/filterAST/hooks/useSavedFilters";

interface SaveFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SaveFilterDialog: React.FC<SaveFilterDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [filterName, setFilterName] = useState("");
  const filterStore = useFilterStore();
  const { saveFilter, isSaving } = useSavedFilters();

  const handleSaveFilter = async () => {
    if (filterStore.filter && filterName.trim()) {
      try {
        await saveFilter(filterName.trim(), filterStore.filter);
        setFilterName("");
        onOpenChange(false);
      } catch (error) {
        console.error("Error saving filter:", error);
        // You could add error handling UI here
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Filter</DialogTitle>
          <DialogDescription>
            Give your filter a name to save it for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Filter name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFilter}
              disabled={!filterName.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFilterDialog;
