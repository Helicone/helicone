import { useMemo } from "react";
import { useOrganizationLayout } from "./organization_layout";
import { OrganizationFilter } from "../lib/organization_layout/organization_layout";
import { v4 as uuidv4 } from "uuid";

/**
 * Hook to manage saved filters for a specific page type
 */
export const useSavedFilters = () => {
  const {
    organizationLayout,
    isLoading,
    refetch,
    isRefetching,
    createLayout,
    updateLayout,
    deleteLayout,
  } = useOrganizationLayout("filter_ast");

  // Extract saved filters from the organization layout
  const savedFilters = useMemo(() => {
    return organizationLayout?.filters || [];
  }, [organizationLayout]);

  /**
   * Save a new filter
   */
  const saveFilter = async (name: string, filter: any) => {
    const newFilter: OrganizationFilter = {
      id: uuidv4(),
      name,
      filter: [filter],
      createdAt: new Date().toISOString(),
      softDelete: false,
    };

    if (organizationLayout) {
      // Update existing layout
      const updatedFilters = [...savedFilters, newFilter];
      return updateLayout.mutateAsync(updatedFilters);
    } else {
      // Create new layout
      return createLayout.mutateAsync([newFilter]);
    }
  };

  /**
   * Delete a saved filter by ID
   */
  const deleteFilter = async (filterId: string) => {
    if (!organizationLayout) return;

    const updatedFilters = savedFilters.filter(
      (filter) => filter.id !== filterId
    );

    if (updatedFilters.length === 0) {
      // If no filters left, delete the entire layout
      return deleteLayout.mutateAsync();
    } else {
      // Update with remaining filters
      return updateLayout.mutateAsync(updatedFilters);
    }
  };

  /**
   * Update an existing filter
   */
  const updateFilter = async (
    filterId: string,
    updates: Partial<OrganizationFilter>
  ) => {
    if (!organizationLayout) return;

    const updatedFilters = savedFilters.map((filter) => {
      if (filter.id === filterId) {
        return { ...filter, ...updates };
      }
      return filter;
    });

    return updateLayout.mutateAsync(updatedFilters);
  };

  /**
   * Get a filter by ID
   */
  const getFilterById = (filterId: string) => {
    return savedFilters.find((filter) => filter.id === filterId);
  };

  return {
    savedFilters,
    isLoading,
    isRefetching,
    refetch,
    saveFilter,
    deleteFilter,
    updateFilter,
    getFilterById,
    isSaving: createLayout.isLoading || updateLayout.isLoading,
    isDeleting: deleteLayout.isLoading,
  };
};
