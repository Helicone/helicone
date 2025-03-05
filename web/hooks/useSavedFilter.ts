import { useRouter, useSearchParams } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useJawnClient } from "../lib/clients/jawnHook";

// These types should match the ones from the backend
export enum FilterFormat {
  LEGACY = "legacy",
  AST = "ast",
}

export interface SavedFilter {
  id: string;
  organization_id: string;
  name?: string;
  filter: any;
  created_at: string;
  last_used: string;
  created_by?: string;
  is_global: boolean;
}

// Define API response types for jawn client
interface JawnResponse<T> {
  data: T | null;
  error: string | null;
}

export interface FilterExpression {
  type: string;
  [key: string]: any;
}

// Helper functions for filter serialization/deserialization
export function serializeFilter(filter: FilterExpression): string {
  return JSON.stringify(filter);
}

export function deserializeFilter(json: string): FilterExpression {
  return JSON.parse(json) as FilterExpression;
}

interface CreateFilterParams {
  name?: string;
  filter: FilterExpression;
  isGlobal?: boolean;
}

const FILTER_ID_PARAM = "filterId";

export function useSavedFilters() {
  const jawn = useJawnClient();
  const queryClient = useQueryClient();

  const filtersQuery = useQuery({
    queryKey: ["savedFilters"],
    queryFn: async () => {
      const response = await jawn.GET("/v1/saved-filters", {});
      if (!response.data) {
        throw new Error("Failed to fetch filters");
      }
      return response.data || [];
    },
  });

  const createFilterMutation = useMutation({
    mutationFn: async (params: CreateFilterParams) => {
      const { name, filter, isGlobal = false } = params;
      const response = await jawn.POST("/v1/saved-filters", {
        body: {
          name,
          filter: serializeFilter(filter),
          is_global: isGlobal,
        },
      });
      if (!response.data) {
        throw new Error("Failed to create filter");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await jawn.DELETE("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId },
        },
      });
      if (!response.data) {
        throw new Error("Failed to delete filter");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
    },
  });

  return {
    filters: filtersQuery.data || [],
    isLoading: filtersQuery.isLoading,
    createFilter: createFilterMutation.mutate,
    isCreating: createFilterMutation.isLoading,
    deleteFilter: deleteFilterMutation.mutate,
    isDeleting: deleteFilterMutation.isLoading,
  };
}

export function useSavedFilter(filterId?: string) {
  const jawn = useJawnClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get filter ID from URL if not provided as parameter
  const paramFilterId = searchParams?.get(FILTER_ID_PARAM);
  const effectiveFilterId = filterId || paramFilterId;

  const filterQuery: UseQueryResult<SavedFilter | null> = useQuery({
    queryKey: ["savedFilter", effectiveFilterId],
    queryFn: async () => {
      if (!effectiveFilterId) return null;

      const response = await jawn.GET("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId: effectiveFilterId },
        },
      });

      if (!response.data) {
        throw new Error("Failed to fetch filter");
      }
      return response.data;
    },
    enabled: !!effectiveFilterId,
  });

  const updateFilterMutation = useMutation({
    mutationFn: async ({
      filterId,
      filter,
    }: {
      filterId: string;
      filter: FilterExpression;
    }) => {
      const response = await jawn.PUT("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId },
        },
        body: {
          filter: serializeFilter(filter),
        },
      });
      if (!response.data && response.data !== null) {
        throw new Error("Failed to update filter");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["savedFilter", variables.filterId],
      });
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
    },
  });

  const markAsUsedMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await jawn.POST("/v1/saved-filters/{filterId}/use", {
        params: {
          path: { filterId },
        },
      });
      if (!response.data && response.data !== null) {
        throw new Error("Failed to mark filter as used");
      }
      return response.data;
    },
  });

  const getFilterExpression = (): FilterExpression | null => {
    if (!filterQuery.data) return null;

    try {
      return deserializeFilter(
        typeof filterQuery.data.filter === "string"
          ? filterQuery.data.filter
          : JSON.stringify(filterQuery.data.filter)
      );
    } catch (error) {
      console.error("Failed to parse filter expression", error);
      return null;
    }
  };

  const setFilterId = (newFilterId: string | null) => {
    if (newFilterId) {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(FILTER_ID_PARAM, newFilterId);
      router.push(`?${params.toString()}`);
    } else {
      const params = new URLSearchParams(searchParams?.toString());
      params.delete(FILTER_ID_PARAM);
      router.push(`?${params.toString()}`);
    }
  };

  return {
    filter: filterQuery.data,
    isLoading: filterQuery.isLoading,
    updateFilter: updateFilterMutation.mutate,
    isUpdating: updateFilterMutation.isLoading,
    markAsUsed: markAsUsedMutation.mutate,
    isMarking: markAsUsedMutation.isLoading,
    getFilterExpression,
    setFilterId,
  };
}
