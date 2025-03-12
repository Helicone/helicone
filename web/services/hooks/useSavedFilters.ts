import { FilterExpression } from "@/filterAST";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";

type StoreFilterType = {
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
 * Hook to manage saved filters for a specific page type
 */
export const useSavedFilters = (options?: {
  autoSaveDelay?: number;
  defaultFilterName?: string;
}) => {
  const { autoSaveDelay = 1000, defaultFilterName = "Untitled Filter" } =
    options || {};
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const queryClient = useQueryClient();
  const jawn = getJawnClient(orgId);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filter state from Zustand store
  const {
    filter,
    activeFilterId,
    hasUnsavedChanges,
    setFilter,
    setActiveFilterId,
    setHasUnsavedChanges,
    clearActiveFilter,
  } = useFilterStore();

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      return response.data as CreateFilterResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });

      // Update the active filter ID and URL
      if (data?.data?.id) {
        setActiveFilterId(data.data.id);
        updateUrlWithFilterId(data.data.id);
      }
    },
  });

  // Update filter mutation
  const updateLayout = useMutation({
    mutationFn: async (params: StoreFilterType) => {
      const response = await jawn.PATCH("/v1/filter/{id}", {
        params: { path: { id: params.id || "" } },
        body: {
          filter: params.filter,
          name: params.name,
        },
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters", orgId] });
      setHasUnsavedChanges(false);
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

      // Clear the active filter if it was deleted
      if (activeFilterId) {
        clearActiveFilter();
        updateUrlWithFilterId(null);
      }
    },
  });

  /**
   * Update the URL with the filter ID
   */
  const updateUrlWithFilterId = useCallback(
    (filterId: string | null) => {
      if (!searchParams) return;

      // Create a new URLSearchParams object based on the current params
      const params = new URLSearchParams(searchParams.toString());

      if (filterId) {
        params.set("filter_id", filterId);
      } else {
        params.delete("filter_id");
      }

      // Update the URL without refreshing the page
      const newUrl = window.location.pathname + "?" + params.toString();
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Load a filter by ID
   */
  const loadFilterById = useCallback(
    async (filterId: string) => {
      const filterToLoad = savedFilters.find(
        (filter: StoreFilterType) => filter.id === filterId
      );

      if (filterToLoad) {
        setFilter(filterToLoad.filter);
        setActiveFilterId(filterId);
        return true;
      }

      return false;
    },
    [savedFilters, setFilter, setActiveFilterId]
  );

  /**
   * Auto-save the current filter if it has an ID
   */
  const autoSaveFilter = useCallback(() => {
    if (!activeFilterId || !hasUnsavedChanges || !filter) return;

    const filterToUpdate = savedFilters.find(
      (f: StoreFilterType) => f.id === activeFilterId
    );

    if (filterToUpdate) {
      updateLayout.mutate({
        ...filterToUpdate,
        filter: filter,
      });
    }
  }, [activeFilterId, hasUnsavedChanges, filter, savedFilters, updateLayout]);

  /**
   * Save a new filter
   */
  const saveFilter = async (
    name: string = defaultFilterName,
    filter: FilterExpression
  ) => {
    // If we have an active filter ID, update it instead of creating a new one
    if (activeFilterId) {
      return updateFilter(activeFilterId, { filter });
    }

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

  /**
   * Create a shareable URL for the current filter
   */
  const getShareableUrl = useCallback(() => {
    if (!activeFilterId) return null;

    // Create a full URL including the origin and pathname
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.set("filter_id", activeFilterId);
    url.search = params.toString();

    return url.toString();
  }, [activeFilterId]);

  // Effect to check for filter_id in URL on initial load
  useEffect(() => {
    if (!searchParams) return;

    const filterIdFromUrl = searchParams.get("filter_id");

    if (filterIdFromUrl && filterIdFromUrl !== activeFilterId) {
      loadFilterById(filterIdFromUrl);
    }
  }, [searchParams, activeFilterId, loadFilterById]);

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
    savedFilters,
    isLoading,
    isRefetching,
    refetch,
    saveFilter,
    deleteFilter,
    updateFilter,
    getFilterById,
    loadFilterById,
    activeFilterId,
    hasUnsavedChanges,
    getShareableUrl,
    updateUrlWithFilterId,
    isSaving: createLayout.isLoading || updateLayout.isLoading,
    isDeleting: deleteLayout.isLoading,
  };
};
