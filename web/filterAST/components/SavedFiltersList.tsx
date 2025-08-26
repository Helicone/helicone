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
  const { crud, helpers } = useFilterAST();
  if (crud.isLoading) {
    return <P className="py-4 text-center">Loading saved filters...</P>;
  }

  if (crud.savedFilters.length === 0) {
    return (
      <P className="py-4 text-center text-muted-foreground">
        No saved filters yet. Create and save a filter to see it here.
      </P>
    );
  }

  return (
    <div className="max-h-[300px] space-y-2 overflow-y-auto">
      {crud.savedFilters.map((filter) => (
        <div
          key={filter.id}
          className="flex cursor-pointer items-center justify-between rounded-md border p-2 hover:bg-accent"
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
