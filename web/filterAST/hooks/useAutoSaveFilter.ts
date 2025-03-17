import { useCallback, useEffect, useRef } from "react";
import { StoreFilterType } from "./useFilterCrud";

interface AutoSaveOptions {
  activeFilterId: string | null;
  hasUnsavedChanges: boolean;
  filter: any;
  savedFilters: StoreFilterType[];
  updateFilter: (filter: StoreFilterType) => Promise<any>;
  autoSaveDelay?: number;
}

/**
 * Hook for auto-saving filters after changes
 */
export const useAutoSaveFilter = ({
  activeFilterId,
  hasUnsavedChanges,
  filter,
  savedFilters,
  updateFilter,
  autoSaveDelay = 1000,
}: AutoSaveOptions) => {
  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Auto-save the current filter if it has an ID
   */
  const autoSaveFilter = useCallback(() => {
    if (!activeFilterId || !hasUnsavedChanges || !filter) return;

    const filterToUpdate = savedFilters.find(
      (f: StoreFilterType) => f.id === activeFilterId
    );

    if (filterToUpdate) {
      updateFilter({
        ...filterToUpdate,
        filter: filter,
      });
    }
  }, [activeFilterId, hasUnsavedChanges, filter, savedFilters, updateFilter]);

  // Effect to handle auto-saving
  useEffect(() => {
    if (hasUnsavedChanges && activeFilterId) {
      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set a new timer for auto-saving
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveFilter();
      }, autoSaveDelay);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, activeFilterId, autoSaveFilter, autoSaveDelay]);

  return {
    autoSaveFilter,
  };
};
