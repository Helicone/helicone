import {
  FilterExpression,
  useFilterActions,
  useFilterNavigation,
} from "@/filterAST";
import { FilterState, useFilterStore } from "@/filterAST/store/filterStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAutoSaveFilter } from "../hooks/useAutoSaveFilter";
import { StoreFilterType, useFilterCrud } from "../hooks/useFilterCrud";

/**
 * Hook to manage saved filters for a specific page type
 */
export const useContextHelpers = ({
  filterStore,
  filterCrud,
}: {
  filterStore: FilterState;
  filterCrud: ReturnType<typeof useFilterCrud>;
}) => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const loadFilterById = useCallback(
    async (filterId: string) => {
      const filterToLoad = await filterCrud.getFilterById(filterId);

      if (filterToLoad && filterToLoad?.filter) {
        filterStore.setFilter(filterToLoad?.filter as FilterExpression);
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

  const saveFilter = async (
    name: string = "Untitled Filter",
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

  const newEmptyFilter = async () => {
    const result = await filterCrud.createFilter.mutateAsync({
      name: "Untitled Filter",
      filter: {
        type: "and",
        expressions: [],
      },
    });

    if (result?.data?.id) {
      loadFilterById(result.data.id);
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
    loadFilterById,
    saveFilter,
    newEmptyFilter,
    deleteFilter,
    updateFilterById,
    getShareableUrl,
  };
};
