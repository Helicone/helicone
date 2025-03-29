import { FilterState } from "@/filterAST/store/filterStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DEFAULT_FILTER_EXPRESSION, FilterExpression } from "../filterAst";
import { StoreFilterType, useFilterCrud } from "../hooks/useFilterCrud";
import useNotification from "@/components/shared/notification/useNotification";

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
  const notification = useNotification();

  const loadFilterById = useCallback(
    async (filterId: string) => {
      const filterToLoad = await filterCrud.getFilterById(filterId);

      if (filterToLoad && filterToLoad?.filter) {
        filterStore.loadFilterContents({
          filter: filterToLoad?.filter as FilterExpression,
          filterId,
          filterName: filterToLoad?.name || "Untitled Filter",
        });
        const params = new URLSearchParams(searchParams?.toString());
        params.set("filter_id", filterId);
        router.push(`${pathname}?${params.toString()}`);
        return true;
      }

      return false;
    },
    [filterCrud, filterStore, pathname, searchParams, router]
  );

  const clearFilter = useCallback(() => {
    filterStore.clearActiveFilter();
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("filter_id");
    router.push(`${pathname}?${params.toString()}`);
  }, [filterStore, pathname, searchParams, router]);

  const saveFilter = async () => {
    if (!filterStore.filter) {
      notification.setNotification("No filter to save", "error");
      return;
    }

    const newFilter: StoreFilterType = {
      name: filterStore.activeFilterName ?? "Untitled Filter",
      filter: filterStore.filter,
      createdAt: new Date().toISOString(),
    };

    const result = await filterCrud.createFilter.mutateAsync(newFilter);

    // Update the active filter ID and URL
    if (result?.data?.id) {
      filterStore.setActiveFilterId(result.data.id);
      const params = new URLSearchParams(searchParams?.toString());
      params.set("filter_id", result.data.id);

      router.push(`${pathname}?${params.toString()}`);
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
    let filterToUpdate: StoreFilterType | undefined =
      filterCrud.savedFilters.find(
        (filter: StoreFilterType) => filter.id === filterId
      );

    if (!filterToUpdate) {
      const result = await filterCrud.getFilterById(filterId);
      if (result) {
        filterToUpdate = {
          ...result,
          id: filterId,
        };
      } else {
        console.error("Filter not found");
        return;
      }
    }

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
    deleteFilter,
    updateFilterById,
    getShareableUrl,
    clearFilter,
  };
};
