import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { FilterExpression } from "@/filterAST/filterAst";
import { StoreFilterType } from "@/filterAST/store/filterStore";
import { useFilterStore } from "@/filterAST/store/filterStore";

/**
 * Hook for managing saved filters using TanStack Query
 * Provides methods for loading, saving, and deleting filters with automatic loading states
 */
export const useTanStackSavedFilters = () => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const queryClient = useQueryClient();
  const filterStore = useFilterStore();

  // Fetch saved filters
  const {
    data: savedFilters = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["savedFilters", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const jawn = getJawnClient(orgId);
      const response = await jawn.GET("/v1/filter", {});

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Ensure the response data is properly typed as StoreFilterType[]
      return (response.data?.data || []).map((filter: any) => ({
        id: filter.id,
        name: filter.name,
        filter: filter.filter as FilterExpression,
        createdAt: filter.createdAt,
      })) as StoreFilterType[];
    },
    enabled: !!orgId,
  });

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async ({
      name,
      filter,
      id,
    }: {
      name: string;
      filter: FilterExpression;
      id?: string;
    }) => {
      if (!orgId) throw new Error("Organization ID is required");

      const jawn = getJawnClient(orgId);

      if (id) {
        // Update existing filter
        const response = await jawn.PATCH("/v1/filter/{id}", {
          params: { path: { id } },
          body: {
            filter,
            name,
          },
        });

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        // Get the createdAt from the response or use the current date
        const responseData = response.data?.data as
          | Record<string, any>
          | undefined;
        const createdAt = responseData?.createdAt || new Date().toISOString();

        return {
          id,
          name,
          filter,
          createdAt,
        } as StoreFilterType;
      } else {
        // Create new filter
        const newFilter: StoreFilterType = {
          name,
          filter,
          createdAt: new Date().toISOString(),
        };

        const response = await jawn.POST("/v1/filter", {
          body: newFilter,
        });

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        const responseData = response.data?.data as { id: string } | undefined;

        return {
          ...newFilter,
          id: responseData?.id,
        } as StoreFilterType;
      }
    },
    onSuccess: (data) => {
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });

      // Update the active filter in the store
      filterStore.setActiveFilter(data);
    },
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      if (!orgId || !filterId)
        throw new Error("Organization ID and Filter ID are required");

      const jawn = getJawnClient(orgId);
      const response = await jawn.DELETE("/v1/filter/{id}", {
        params: { path: { id: filterId } },
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return filterId;
    },
    onSuccess: (filterId) => {
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });

      // If the deleted filter was active, clear it
      if (filterStore.activeFilter?.id === filterId) {
        filterStore.clearActiveFilter();
      }
    },
  });

  // Load a filter by ID
  const loadFilterById = (filterId: string) => {
    const filterToLoad = savedFilters.find((filter) => filter.id === filterId);
    if (filterToLoad) {
      filterStore.setActiveFilter(filterToLoad);
      return true;
    }
    return false;
  };

  // Save a filter
  const saveFilter = async (name: string, filter: FilterExpression) => {
    const { activeFilter } = filterStore;
    return saveFilterMutation.mutateAsync({
      name,
      filter,
      id: activeFilter?.id,
    });
  };

  // Delete a filter
  const deleteFilter = async (filterId: string) => {
    return deleteFilterMutation.mutateAsync(filterId);
  };

  return {
    savedFilters,
    isLoading,
    isError,
    error,
    isSaving: saveFilterMutation.isLoading,
    isDeleting: deleteFilterMutation.isLoading,
    saveFilter,
    deleteFilter,
    loadFilterById,
    refetch,
  };
};

export default useTanStackSavedFilters;
