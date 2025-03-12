import { FilterExpression } from "@/filterAST";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";

type StoreFilterType = {
  id?: string;
  name: string;
  filter: any;
  createdAt?: string;
};

/**
 * Hook to manage saved filters for a specific page type
 */
export const useSavedFilters = () => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const queryClient = useQueryClient();
  const jawn = getJawnClient(orgId);

  // Fetch saved filters
  const {
    data: savedFiltersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["savedFilters", orgId],
    queryFn: async () => {
      if (!orgId) {
        return [] as StoreFilterType[];
      }

      const response = await jawn.GET("/v1/filter", {});

      if (response.data?.error) {
        throw new Error(response.error);
      }

      return (response.data?.data || []) as StoreFilterType[];
    },
    enabled: !!orgId,
  });

  // Extract saved filters
  const savedFilters = useMemo(() => {
    return savedFiltersData || [];
  }, [savedFiltersData]);

  // Create filter mutation
  const createLayout = useMutation({
    mutationFn: async (filter: StoreFilterType) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const response = await jawn.POST("/v1/filter", {
        body: filter,
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
    },
  });

  // Update filter mutation
  const updateLayout = useMutation({
    mutationFn: async (params: StoreFilterType) => {
      const response = await jawn.PATCH("/v1/filter/{id}", {
        params: { path: { id: params.id || "" } },
        body: params.filter,
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
    },
  });

  // Delete filter mutation
  const deleteLayout = useMutation({
    mutationFn: async (id: string) => {
      console.log("deleting filter", id);
      const response = await jawn.DELETE("/v1/filter/{id}", {
        params: { path: { id } },
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
    },
  });

  /**
   * Save a new filter
   */
  const saveFilter = async (name: string, filter: FilterExpression) => {
    const newFilter: StoreFilterType = {
      name,
      filter: filter,
      createdAt: new Date().toISOString(),
    };

    // Create new layout with the filter
    return createLayout.mutateAsync(newFilter);
  };

  /**
   * Delete a saved filter by ID
   */
  const deleteFilter = async (filterId: string) => {
    return deleteLayout.mutateAsync(filterId);
  };

  /**
   * Update an existing filter
   */
  const updateFilter = async (
    filterId: string,
    updates: Partial<StoreFilterType>
  ) => {
    const filterToUpdate = savedFilters.find(
      (filter: StoreFilterType) => filter.id === filterId
    );

    if (!filterToUpdate) return;

    const updatedFilter = { ...filterToUpdate, ...updates };

    return updateLayout.mutateAsync(updatedFilter);
  };

  /**
   * Get a filter by ID
   */
  const getFilterById = (filterId: string) => {
    return savedFilters.find(
      (filter: StoreFilterType) => filter.id === filterId
    );
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
