import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";
import { useCallback } from "react";

export type StoreFilterType = {
  id?: string;
  name: string;
  filter: any;
  createdAt?: string;
};

// Define the response type for the create filter API
interface CreateFilterResponse {
  data: {
    id: string;
    [key: string]: any;
  } | null;
  error: string | null;
}

/**
 * Hook for filter CRUD operations using TanStack Query
 */
export const useFilterCrud = () => {
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

  const getFilterById = useCallback(
    async (id: string): Promise<StoreFilterType | undefined> => {
      if (savedFiltersData?.some((filter) => filter.id === id)) {
        return savedFiltersData?.find((filter) => filter.id === id);
      }

      const response = await jawn.GET("/v1/filter/{id}", {
        params: { path: { id } },
      });
      return response.data?.data as StoreFilterType;
    },
    [jawn, savedFiltersData]
  );

  // Extract saved filters
  const savedFilters = savedFiltersData || [];

  // Create filter mutation
  const createFilter = useMutation({
    mutationKey: ["createFilter", orgId],
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
      await refetch();

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
    },
  });

  // Update filter mutation
  const updateFilter = useMutation({
    mutationKey: ["updateFilter", orgId],
    mutationFn: async (params: StoreFilterType) => {
      const response = await jawn.PATCH("/v1/filter/{id}", {
        params: { path: { id: params.id || "" } },
        body: {
          filters: params,
        },
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
      refetch();
    },
  });

  // Delete filter mutation
  const deleteFilter = useMutation({
    mutationKey: ["deleteFilter", orgId],
    mutationFn: async (id: string) => {
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
      refetch();
    },
  });

  /**
   * Create a shareable URL for a filter
   */
  const getShareableUrl = (filterId: string | null) => {
    if (!filterId) return null;

    // Create a full URL including the origin and pathname
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.set("filter_id", filterId);
    url.search = params.toString();

    return url.toString();
  };

  return {
    savedFilters,
    isLoading,
    isRefetching,
    refetch,
    createFilter,
    updateFilter,
    deleteFilter,
    getFilterById,
    getShareableUrl,
    isSaving: createFilter.isLoading || updateFilter.isLoading,
    isDeleting: deleteFilter.isLoading,
  };
};
