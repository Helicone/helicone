import { useCallback, useEffect, useRef } from "react";
import { StoreFilterType } from "./useFilterCrud";

interface AutoSaveOptions {
  activeFilterId: string | null;
  hasUnsavedChanges: boolean;
  filter: any;
  updateFilterById: (
    filterId: string,
    updates: Partial<StoreFilterType>
  ) => Promise<void>;
  autoSaveDelay?: number;
  filterName: string;
}

/**
 * Hook for auto-saving filters after changes
 */
export const useAutoSaveFilter = ({
  activeFilterId,
  hasUnsavedChanges,
  filter,
  updateFilterById,
  autoSaveDelay = 1000,
  filterName,
}: AutoSaveOptions) => {
  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Auto-save the current filter if it has an ID
   */
  const autoSaveFilter = useCallback(() => {
    if (!activeFilterId || !hasUnsavedChanges || !filter) return;

    updateFilterById(activeFilterId, {
      filter: filter,
      name: filterName,
    });
  }, [activeFilterId, hasUnsavedChanges, filter, updateFilterById, filterName]);

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
