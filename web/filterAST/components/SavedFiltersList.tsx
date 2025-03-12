import React from "react";
import { useFilterStore } from "../store/filterStore";
import { Button } from "@/components/ui/button";
import { P, Small } from "@/components/ui/typography";
import { Trash2 } from "lucide-react";
import { useFilterAST } from "@/filterAST/context/filterContext";

interface SavedFiltersListProps {
  onClose?: () => void;
}

export const SavedFiltersList: React.FC<SavedFiltersListProps> = ({
  onClose,
}) => {
  const filterStore = useFilterStore();
  const { crud, helpers } = useFilterAST();
  if (crud.isLoading) {
    return <P className="text-center py-4">Loading saved filters...</P>;
  }

  if (crud.savedFilters.length === 0) {
    return (
      <P className="text-center py-4 text-muted-foreground">
        No saved filters yet. Create and save a filter to see it here.
      </P>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {crud.savedFilters.map((filter) => (
        <div
          key={filter.id}
          className="p-2 border rounded-md hover:bg-accent cursor-pointer flex justify-between items-center"
          onClick={() => helpers.loadFilterById(filter.id || "")}
        >
          <div>
            <P className="font-medium">{filter.name}</P>
            <Small className="text-muted-foreground">
              {filter.createdAt
                ? new Date(filter.createdAt).toLocaleDateString()
                : "Unknown date"}
            </Small>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => helpers.deleteFilter(filter.id || "")}
            disabled={crud.isDeleting}
            className="opacity-50 hover:opacity-100"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SavedFiltersList;
