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

  const handleSaveFilter = () => {
    if (filterStore.filter && filterName.trim()) {
      filterStore.saveFilter(filterName.trim(), filterStore.filter);
      setFilterName("");
      onOpenChange(false);
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
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFilterDialog;
