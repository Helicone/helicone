import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FilterExpression,
  condition,
  and,
  propertyCondition,
  scoreCondition,
} from "@/services/lib/filters/filterAst";
import {
  addCondition,
  transformToGroup,
  deleteNode,
  updateNode,
  changeGroupType,
  createDefaultCondition,
  createDefaultPropertyCondition,
  createDefaultScoreCondition,
} from "@/components/shared/themed/filterAST/utils";

// Constants
const FILTER_ID_PARAM = "filterId";

// Types
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

interface CreateFilterParams {
  name?: string;
  filter: FilterExpression;
  isGlobal?: boolean;
}

// Helper functions
export function serializeFilter(filter: FilterExpression): string {
  return JSON.stringify(filter);
}

export function deserializeFilter(json: string): FilterExpression {
  try {
    return JSON.parse(json) as FilterExpression;
  } catch (error) {
    console.error("Failed to parse filter expression", error);
    return createDefaultCondition();
  }
}

// Create a default filter (a single condition)
function createDefaultFilter(): FilterExpression {
  return createDefaultCondition();
}

// Create a default property filter
function createDefaultPropertyFilter(): FilterExpression {
  return and(createDefaultPropertyCondition());
}

// Create a default score filter
function createDefaultScoreFilter(): FilterExpression {
  return and(createDefaultScoreCondition());
}

// Zustand store for local filter state
interface FilterState {
  // Current filter being edited
  currentFilter: FilterExpression;

  // Filter operations
  setFilter: (filter: FilterExpression) => void;
  updateNode: (path: number[], updatedNode: FilterExpression) => void;
  addCondition: (path: number[]) => void;
  addPropertyCondition: (path: number[]) => void;
  addScoreCondition: (path: number[]) => void;
  transformToGroup: (path: number[], type: "and" | "or") => void;
  deleteNode: (path: number[]) => void;
  changeGroupType: (path: number[], newType: "and" | "or") => void;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    dragPath: number[],
    hoverPath: number[]
  ) => void;

  // Reset to default filters
  resetFilter: () => void;
  setPropertyFilter: () => void;
  setScoreFilter: () => void;
}

// Create the store
export const useFilterStore = create<FilterState>()(
  devtools(
    (set, get) => ({
      currentFilter: createDefaultFilter(),

      setFilter: (filter) => set({ currentFilter: filter }),

      updateNode: (path, updatedNode) => {
        const newFilter = updateNode(get().currentFilter, path, updatedNode);
        set({ currentFilter: newFilter });
      },

      addCondition: (path) => {
        const newFilter = addCondition(get().currentFilter, path);
        set({ currentFilter: newFilter });
      },

      addPropertyCondition: (path) => {
        const { currentFilter } = get();

        if (path.length === 0) {
          // If we're at the root and it's not a group, convert to a group
          if (currentFilter.type === "condition") {
            set({
              currentFilter: and(
                currentFilter,
                createDefaultPropertyCondition()
              ),
            });
          } else if (
            currentFilter.type === "and" ||
            currentFilter.type === "or"
          ) {
            // Otherwise just add to the existing group
            const newFilter = updateNode(currentFilter, path, {
              ...currentFilter,
              expressions: [
                ...currentFilter.expressions,
                createDefaultPropertyCondition(),
              ],
            });
            set({ currentFilter: newFilter });
          }
        } else {
          // Add to a nested group
          const newFilter = updateNode(currentFilter, path, (node) => {
            if (node.type === "and" || node.type === "or") {
              return {
                ...node,
                expressions: [
                  ...node.expressions,
                  createDefaultPropertyCondition(),
                ],
              };
            }
            return node;
          });
          set({ currentFilter: newFilter });
        }
      },

      addScoreCondition: (path) => {
        const { currentFilter } = get();

        if (path.length === 0) {
          // If we're at the root and it's not a group, convert to a group
          if (currentFilter.type === "condition") {
            set({
              currentFilter: and(currentFilter, createDefaultScoreCondition()),
            });
          } else if (
            currentFilter.type === "and" ||
            currentFilter.type === "or"
          ) {
            // Otherwise just add to the existing group
            const newFilter = updateNode(currentFilter, path, {
              ...currentFilter,
              expressions: [
                ...currentFilter.expressions,
                createDefaultScoreCondition(),
              ],
            });
            set({ currentFilter: newFilter });
          }
        } else {
          // Add to a nested group
          const newFilter = updateNode(currentFilter, path, (node) => {
            if (node.type === "and" || node.type === "or") {
              return {
                ...node,
                expressions: [
                  ...node.expressions,
                  createDefaultScoreCondition(),
                ],
              };
            }
            return node;
          });
          set({ currentFilter: newFilter });
        }
      },

      transformToGroup: (path, type) => {
        const newFilter = transformToGroup(get().currentFilter, path, type);
        set({ currentFilter: newFilter });
      },

      deleteNode: (path) => {
        const newFilter = deleteNode(get().currentFilter, path);
        set({ currentFilter: newFilter });
      },

      changeGroupType: (path, newType) => {
        const newFilter = changeGroupType(get().currentFilter, path, newType);
        set({ currentFilter: newFilter });
      },

      moveItem: (dragIndex, hoverIndex, dragPath, hoverPath) => {
        // Only handle reordering within the same parent for now
        if (
          dragPath.length !== hoverPath.length ||
          dragPath.slice(0, -1).join(".") !== hoverPath.slice(0, -1).join(".")
        ) {
          return;
        }

        const { currentFilter } = get();
        const parentPath = dragPath.slice(0, -1);

        // Get the parent node
        let parentNode;
        if (parentPath.length === 0) {
          parentNode = currentFilter;
        } else {
          const getNodeAtPath = (node: any, path: number[], index = 0): any => {
            if (index >= path.length) return node;
            return getNodeAtPath(
              node.expressions[path[index]],
              path,
              index + 1
            );
          };
          parentNode = getNodeAtPath(currentFilter, parentPath);
        }

        if (!parentNode || !parentNode.expressions) return;

        // Create a new array with the reordered items
        const newExpressions = [...parentNode.expressions];
        const [movedItem] = newExpressions.splice(dragIndex, 1);
        newExpressions.splice(hoverIndex, 0, movedItem);

        // Update the parent node with the new expressions array
        if (parentPath.length === 0) {
          if (currentFilter.type === "and" || currentFilter.type === "or") {
            set({
              currentFilter: {
                ...currentFilter,
                expressions: newExpressions,
              } as FilterExpression,
            });
          }
        } else {
          const newFilter = updateNode(currentFilter, parentPath, (node) => {
            if (node.type === "and" || node.type === "or") {
              return {
                ...node,
                expressions: newExpressions,
              };
            }
            return node;
          });
          set({ currentFilter: newFilter });
        }
      },

      resetFilter: () => set({ currentFilter: createDefaultFilter() }),

      setPropertyFilter: () =>
        set({ currentFilter: createDefaultPropertyFilter() }),

      setScoreFilter: () => set({ currentFilter: createDefaultScoreFilter() }),
    }),
    {
      name: "filter-store",
    }
  )
);

// Hook for integrating with TanStack Query and saved filters
export function useSavedFilterStore() {
  const jawn = useJawnClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const filterStore = useFilterStore();

  // Get filter ID from URL
  const filterId = searchParams?.get(FILTER_ID_PARAM);

  // Query for saved filters list
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

  // Query for specific filter by ID
  const filterQuery = useQuery({
    queryKey: ["savedFilter", filterId],
    queryFn: async () => {
      if (!filterId) return null;

      const response = await jawn.GET("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId },
        },
      });

      if (!response.data) {
        throw new Error("Failed to fetch filter");
      }

      // Update local store with the fetched filter
      if (response.data) {
        try {
          const filterExpression = deserializeFilter(
            typeof response.data.filter === "string"
              ? response.data.filter
              : JSON.stringify(response.data.filter)
          );
          filterStore.setFilter(filterExpression);
        } catch (error) {
          console.error("Failed to parse filter expression", error);
        }
      }

      return response.data;
    },
    enabled: !!filterId,
  });

  // Create filter mutation
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
      // Navigate to the new filter
      if (data.id) {
        setFilterId(data.id);
      }
    },
  });

  // Update filter mutation
  const updateFilterMutation = useMutation({
    mutationFn: async ({
      filterId,
      filter,
      name,
    }: {
      filterId: string;
      filter: FilterExpression;
      name?: string;
    }) => {
      const body: any = {
        filter: serializeFilter(filter),
      };

      if (name !== undefined) {
        body.name = name;
      }

      const response = await jawn.PUT("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId },
        },
        body,
      });

      if (response.error) {
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

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await jawn.DELETE("/v1/saved-filters/{filterId}", {
        params: {
          path: { filterId },
        },
      });

      if (response.error) {
        throw new Error("Failed to delete filter");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
      // Clear the filter ID from URL
      setFilterId(null);
      // Reset the local filter
      filterStore.resetFilter();
    },
  });

  // Mark filter as used mutation
  const markAsUsedMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const response = await jawn.POST("/v1/saved-filters/{filterId}/use", {
        params: {
          path: { filterId },
        },
      });

      if (response.error) {
        throw new Error("Failed to mark filter as used");
      }

      return response.data;
    },
  });

  // Helper to set filter ID in URL
  const setFilterId = (newFilterId: string | null) => {
    const timestamp = Date.now();
    console.log(`[FS-${timestamp}] setFilterId called with:`, newFilterId);

    if (newFilterId) {
      try {
        const params = new URLSearchParams(searchParams?.toString());
        params.set(FILTER_ID_PARAM, newFilterId);
        const newUrl = `?${params.toString()}`;
        console.log(`[FS-${timestamp}] Setting URL to:`, newUrl);
        router.push(newUrl);
      } catch (error) {
        console.error(
          `[FS-${timestamp}] Error setting filter ID in URL:`,
          error
        );
      }
    } else {
      try {
        const params = new URLSearchParams(searchParams?.toString());
        params.delete(FILTER_ID_PARAM);
        const newUrl = `?${params.toString()}`;
        console.log(
          `[FS-${timestamp}] Clearing filter ID from URL, new URL:`,
          newUrl
        );
        router.push(newUrl);
      } catch (error) {
        console.error(
          `[FS-${timestamp}] Error clearing filter ID from URL:`,
          error
        );
      }
    }
  };

  // Save current filter
  const saveFilter = async (name?: string, isGlobal?: boolean) => {
    const timestamp = Date.now();
    console.log(`[FS-${timestamp}] saveFilter called with:`, {
      name,
      isGlobal,
      filterId,
    });
    console.log(
      `[FS-${timestamp}] Current filter state:`,
      filterStore.currentFilter
    );

    return new Promise((resolve, reject) => {
      try {
        if (filterId) {
          // Update existing filter
          console.log(`[FS-${timestamp}] Updating existing filter:`, filterId);
          updateFilterMutation.mutate(
            {
              filterId,
              filter: filterStore.currentFilter,
              name,
            },
            {
              onSuccess: (data) => {
                console.log(
                  `[FS-${timestamp}] Filter updated successfully:`,
                  data
                );
                resolve(data);
              },
              onError: (error) => {
                console.error(
                  `[FS-${timestamp}] Failed to update filter:`,
                  error
                );
                reject(error);
              },
            }
          );
        } else {
          // Create new filter
          console.log(`[FS-${timestamp}] Creating new filter with name:`, name);
          createFilterMutation.mutate(
            {
              name,
              filter: filterStore.currentFilter,
              isGlobal,
            },
            {
              onSuccess: (data) => {
                console.log(
                  `[FS-${timestamp}] Filter created successfully:`,
                  data
                );
                console.log(`[FS-${timestamp}] Data.id:`, data?.id);

                // Log current URL state before navigation
                if (searchParams) {
                  console.log(
                    `[FS-${timestamp}] Current URL params:`,
                    searchParams.toString()
                  );
                }

                if (data?.id) {
                  console.log(
                    `[FS-${timestamp}] Setting filter ID in URL:`,
                    data.id
                  );
                }

                resolve(data);
              },
              onError: (error) => {
                console.error(
                  `[FS-${timestamp}] Failed to create filter:`,
                  error
                );
                reject(error);
              },
            }
          );
        }
      } catch (error) {
        console.error(`[FS-${timestamp}] Error in saveFilter:`, error);
        reject(error);
      }
    });
  };

  return {
    // Local filter state and operations
    filter: filterStore.currentFilter,
    setFilter: filterStore.setFilter,
    updateNode: filterStore.updateNode,
    addCondition: filterStore.addCondition,
    addPropertyCondition: filterStore.addPropertyCondition,
    addScoreCondition: filterStore.addScoreCondition,
    transformToGroup: filterStore.transformToGroup,
    deleteNode: filterStore.deleteNode,
    changeGroupType: filterStore.changeGroupType,
    moveItem: filterStore.moveItem,
    resetFilter: filterStore.resetFilter,
    setPropertyFilter: filterStore.setPropertyFilter,
    setScoreFilter: filterStore.setScoreFilter,

    // Saved filters data and operations
    savedFilters: filtersQuery.data || [],
    savedFilter: filterQuery.data,
    isFetchingFilters: filtersQuery.isLoading,
    isFetchingFilter: filterQuery.isLoading,

    // Mutations
    saveFilter,
    deleteFilter: deleteFilterMutation.mutate,
    markAsUsed: markAsUsedMutation.mutate,

    // Mutation states
    isSaving: createFilterMutation.isLoading || updateFilterMutation.isLoading,
    isDeleting: deleteFilterMutation.isLoading,
    isMarking: markAsUsedMutation.isLoading,

    // URL state
    filterId,
    setFilterId,
  };
}
