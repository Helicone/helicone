import React from "react";
import { useFilterStore } from "../store/filterStore";
import { H4, P } from "@/components/ui/typography";

interface SavedFiltersListProps {
  className?: string;
}

export const SavedFiltersList: React.FC<SavedFiltersListProps> = ({
  className = "",
}) => {
  const filterStore = useFilterStore();

  const handleLoadFilter = (id: string) => {
    filterStore.loadSavedFilter(id);
  };

  if (filterStore.savedFilters.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <H4 className="mb-2">Saved Filters</H4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filterStore.savedFilters.map((savedFilter) => (
          <div
            key={savedFilter.id}
            className="p-2 border rounded cursor-pointer hover:bg-accent"
            onClick={() => handleLoadFilter(savedFilter.id)}
          >
            <P>{savedFilter.name}</P>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedFiltersList;
