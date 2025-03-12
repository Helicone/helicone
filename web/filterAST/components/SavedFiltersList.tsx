import React from "react";
import { useFilterStore } from "../store/filterStore";
import { Button } from "@/components/ui/button";
import { P, Small } from "@/components/ui/typography";
import { Trash2 } from "lucide-react";
import { useSavedFilters } from "@/services/hooks/useSavedFilters";

interface SavedFiltersListProps {
  onClose?: () => void;
}

export const SavedFiltersList: React.FC<SavedFiltersListProps> = ({
  onClose,
}) => {
  const filterStore = useFilterStore();
  const { savedFilters, isLoading, deleteFilter, isDeleting, refetch } =
    useSavedFilters();

  // Load a saved filter
  const handleLoadFilter = (filterId: string) => {
    const filter = savedFilters.find((f) => f.id === filterId);
    if (filter && filter.filter && filter.filter[0]) {
      // Cast the filter to the expected type
      const filterExpression = filter.filter[0] as any;
      filterStore.setFilter(filterExpression);
      if (onClose) onClose();
    }
  };

  // Delete a saved filter
  const handleDeleteFilter = async (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the load filter action
    try {
      await deleteFilter(filterId);
      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error("Error deleting filter:", error);
    }
  };

  if (isLoading) {
    return <P className="text-center py-4">Loading saved filters...</P>;
  }

  if (savedFilters.length === 0) {
    return (
      <P className="text-center py-4 text-muted-foreground">
        No saved filters yet. Create and save a filter to see it here.
      </P>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {savedFilters.map((filter) => (
        <div
          key={filter.id}
          className="p-2 border rounded-md hover:bg-accent cursor-pointer flex justify-between items-center"
          onClick={() => handleLoadFilter(filter.id)}
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
            onClick={(e) => handleDeleteFilter(filter.id, e)}
            disabled={isDeleting}
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
