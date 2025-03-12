import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFilterStore, StoreFilterType } from "../store/filterStore";
import { FilterExpression } from "../filterAst";
import { useTanStackSavedFilters } from "@/services/hooks/useTanStackSavedFilters";

/**
 * Hook that wraps the filter store and automatically handles URL synchronization
 * This provides a simpler API for components that need filter functionality with URL persistence
 */
export const useUrlSyncedFilterStore = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterStore = useFilterStore();
  const prevFilterIdRef = useRef<string | null>(null);

  const {
    loadFilterById,
    savedFilters,
    isLoading: isLoadingSavedFilters,
    isSaving: isSavingFilter,
    isDeleting: isDeletingFilter,
    saveFilter: tanStackSaveFilter,
    deleteFilter: tanStackDeleteFilter,
    refetch: fetchSavedFilters,
  } = useTanStackSavedFilters();

  const {
    activeFilter,
    hasUnsavedChanges,
    setActiveFilter,
    updateFilterExpression,
    addFilterExpression,
    removeFilterExpression,
    updateFilterName,
    clearActiveFilter,
    setHasUnsavedChanges,
  } = filterStore;

  // Sync with URL on initial load and when URL changes
  useEffect(() => {
    if (!searchParams) return;

    const filterIdFromUrl = searchParams.get("filter_id");

    // Only load if the filter ID has changed
    if (filterIdFromUrl && filterIdFromUrl !== prevFilterIdRef.current) {
      loadFilterById(filterIdFromUrl);
      prevFilterIdRef.current = filterIdFromUrl;
    } else if (!filterIdFromUrl && prevFilterIdRef.current) {
      // URL filter ID was removed
      clearActiveFilter();
      prevFilterIdRef.current = null;
    }
  }, [searchParams, loadFilterById, clearActiveFilter]);

  // Update URL when active filter changes
  useEffect(() => {
    const currentFilterId = activeFilter?.id || null;

    // Only update URL if the filter ID has changed
    if (currentFilterId !== prevFilterIdRef.current) {
      if (!searchParams || !router) return;

      const params = new URLSearchParams(searchParams.toString());

      if (currentFilterId) {
        params.set("filter_id", currentFilterId);
      } else {
        params.delete("filter_id");
      }

      // Update the URL without refreshing the page
      const newUrl = window.location.pathname + "?" + params.toString();
      router.replace(newUrl, { scroll: false });
      prevFilterIdRef.current = currentFilterId;
    }
  }, [activeFilter, router, searchParams]);

  return {
    // Original store properties
    activeFilter,
    hasUnsavedChanges,
    savedFilters,
    isLoadingSavedFilters,
    isSavingFilter,
    isDeletingFilter,

    loadFilterById,

    // Original actions that don't need URL syncing
    updateFilterExpression,
    addFilterExpression,
    removeFilterExpression,
    updateFilterName,
    setHasUnsavedChanges,
    fetchSavedFilters,
    getShareableUrl,
  };
};

export default useUrlSyncedFilterStore;
