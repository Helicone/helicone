import { FilterExpression } from "@/filterAST";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAutoSaveFilter } from "./useAutoSaveFilter";
import { StoreFilterType, useFilterCrud } from "./useFilterCrud";

/**
 * Hook to manage saved filters for a specific page type
 */
export const useFilterAST = (options?: {
  autoSaveDelay?: number;
  defaultFilterName?: string;
}) => {
  const { autoSaveDelay = 1000, defaultFilterName = "Untitled Filter" } =
    options || {};

  // Get filter state from Zustand store
  const filterStore = useFilterStore();
  const filterCrud = useFilterCrud();
  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = usePathname();

  /**
   * Load a filter by ID
   */
  const loadFilterById = useCallback(
    async (filterId: string) => {
      const filterToLoad = filterCrud.savedFilters.find(
        (filter: StoreFilterType) => filter.id === filterId
      );

      if (filterToLoad) {
        filterStore.setFilter(filterToLoad.filter);
        filterStore.setActiveFilterId(filterId);
        const params = new URLSearchParams(searchParams?.toString());
        params.set("filter_id", filterId);
        router.push(`${pathname}?${params.toString()}`);
        return true;
      }

      return false;
    },
    [filterCrud, filterStore, pathname, searchParams, router]
  );

  // Initial URL hook
  useEffect(() => {
    if (filterStore.initialFilterId && !filterStore.activeFilterId) {
      loadFilterById(filterStore.initialFilterId);
    }
    const newInitialFilterId = searchParams?.get("filter_id");
    if (newInitialFilterId) {
      filterStore.setInitialFilterId(newInitialFilterId);
    }
  }, [searchParams, filterStore, loadFilterById]);

  // Use the auto-save hook
  useAutoSaveFilter({
    activeFilterId: filterStore.activeFilterId,
    hasUnsavedChanges: filterStore.hasUnsavedChanges,
    filter: filterStore.filter,
    savedFilters: filterCrud.savedFilters,
    updateFilter: async (filter) => {
      await filterCrud.updateFilter.mutateAsync(filter);
      filterStore.setHasUnsavedChanges(false);
    },
    autoSaveDelay,
  });

  /**
   * Save a new filter
   */
  const saveFilter = async (
    name: string = defaultFilterName,
    filter: FilterExpression
  ) => {
    // If we have an active filter ID, update it instead of creating a new one
    if (filterStore.activeFilterId) {
      return filterCrud.updateFilter.mutateAsync({
        id: filterStore.activeFilterId,
        filter,
        name,
      });
    }

    const newFilter: StoreFilterType = {
      name,
      filter: filter,
      createdAt: new Date().toISOString(),
    };

    // Create new filter
    const result = await filterCrud.createFilter.mutateAsync(newFilter);

    // Update the active filter ID and URL
    if (result?.data?.id) {
      filterStore.setActiveFilterId(result.data.id);
    }

    return result;
  };

  /**
   * Delete a saved filter by ID
   */
  const deleteFilter = async (filterId: string) => {
    const result = await filterCrud.deleteFilter.mutateAsync(filterId);

    // Clear the active filter if it was deleted
    if (filterId === filterStore.activeFilterId) {
      filterStore.clearActiveFilter();
    }

    return result;
  };

  /**
   * Update an existing filter
   */
  const updateFilterById = async (
    filterId: string,
    updates: Partial<StoreFilterType>
  ) => {
    const filterToUpdate = filterCrud.savedFilters.find(
      (filter: StoreFilterType) => filter.id === filterId
    );

    if (!filterToUpdate) return;

    const updatedFilter = { ...filterToUpdate, ...updates };

    const result = await filterCrud.updateFilter.mutateAsync(updatedFilter);
    filterStore.setHasUnsavedChanges(false);
    return result;
  };

  /**
   * Create a shareable URL for the current filter
   */
  const getShareableUrl = useCallback(() => {
    if (!filterStore.activeFilterId) return null;

    // Create a full URL including the origin and pathname
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.set("filter_id", filterStore.activeFilterId);
    url.search = params.toString();

    return url.toString();
  }, [filterStore.activeFilterId]);

  return {
    savedFilters: filterCrud.savedFilters,
    isLoading: filterCrud.isLoading,
    isRefetching: filterCrud.isRefetching,
    refetch: filterCrud.refetch,
    saveFilter,
    deleteFilter,
    updateFilter: updateFilterById,
    getFilterById: filterCrud.getFilterById,
    loadFilterById,
    activeFilterId: filterStore.activeFilterId,
    hasUnsavedChanges: filterStore.hasUnsavedChanges,
    getShareableUrl,
    isSaving: filterCrud.isSaving,
    isDeleting: filterCrud.isDeleting,
  };
};
