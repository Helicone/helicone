import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AndExpression,
  EMPTY_FILTER_GROUP_EXPRESSION,
  FilterExpression,
  OrExpression,
} from "../filterAst";

export interface FilterState {
  // The active filter expression
  filter: FilterExpression | null;

  // The ID of the currently active saved filter (if any)
  activeFilterId: string | null;

  // Whether the filter has been loaded from the URL
  alreadyLoadedOnce: boolean;

  // initial filter id
  initialFilterId: string | null;

  // Whether the filter has unsaved changes
  hasUnsavedChanges: boolean;

  // The name of the currently active saved filter (if any)
  activeFilterName: string | null;

  // Actions
  setFilter: (filter: FilterExpression | null) => void;
  updateFilterExpression: (
    path: number[],
    expression: FilterExpression
  ) => void;
  addFilterExpression: (
    parentPath: number[],
    expression: FilterExpression
  ) => void;
  removeFilterExpression: (path: number[]) => void;
  setInitialFilterId: (id: string | null) => void;
  // Actions for managing the active filter ID
  setActiveFilterId: (id: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  clearActiveFilter: () => void;
  setActiveFilterName: (name: string | null) => void;
  getParentPath: (path: number[]) => number[];
  getFilterExpression: (path: number[]) => FilterExpression | null;
  getFilterNodeCount: () => number;
  loadFilterContents: ({
    filter,
    filterId,
    filterName,
  }: {
    filter: FilterExpression;
    filterId: string;
    filterName: string;
  }) => void;
}

const _getFilterNodeCount = (filter: FilterExpression): number => {
  if (filter.type === "and" || filter.type === "or") {
    return filter.expressions.reduce((acc, expression) => {
      return acc + _getFilterNodeCount(expression);
    }, 0);
  }

  return 1;
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filter: EMPTY_FILTER_GROUP_EXPRESSION,
      activeFilterId: null,
      initialFilterId: null,
      hasUnsavedChanges: false,
      activeFilterName: null,
      alreadyLoadedOnce: false,

      loadFilterContents: ({
        filter,
        filterId,
        filterName,
      }: {
        filter: FilterExpression;
        filterId: string;
        filterName: string;
      }) => {
        set({
          filter,
          activeFilterId: filterId,
          activeFilterName: filterName,
          alreadyLoadedOnce: true,
        });
      },

      setAlreadyLoadedOnce: () => {
        set({ alreadyLoadedOnce: true });
      },

      setInitialFilterId: (id: string | null) => {
        if (get().initialFilterId !== null) return;
        set({ initialFilterId: id });
      },

      setFilter: (filter) => {
        set({
          filter,
          hasUnsavedChanges: get().activeFilterId !== null,
        });
      },

      getParentPath: (path: number[]) => {
        return path.slice(0, -1);
      },

      getFilterExpression: (path: number[]) => {
        const { filter } = get();
        if (!filter) return null;

        let current = filter;
        for (let i = 0; i < path.length; i++) {
          if (current.type !== "and" && current.type !== "or") break;
          current = current.expressions[path[i]] as
            | AndExpression
            | OrExpression;
        }

        return current;
      },

      getFilterNodeCount: () => {
        const { filter } = get();
        if (!filter) return 0;
        return _getFilterNodeCount(filter);
      },

      updateFilterExpression: (path, expression) => {
        const { filter } = get();
        if (!filter) return;

        // Deep clone the filter
        const newFilter = JSON.parse(JSON.stringify(filter));

        // Navigate to the target node
        let current = newFilter as AndExpression | OrExpression;
        let parent = null;
        let index = -1;

        for (let i = 0; i < path.length; i++) {
          if (current.type !== "and" && current.type !== "or") break;

          parent = current;
          index = path[i];
          current = current.expressions[path[i]] as
            | AndExpression
            | OrExpression;
        }

        // Update the expression
        if (
          parent &&
          (parent.type === "and" || parent.type === "or") &&
          index >= 0
        ) {
          parent.expressions[index] = expression;
        } else {
          // This is the root node
          set({
            filter: expression,
            hasUnsavedChanges: get().activeFilterId !== null,
          });
          return;
        }

        set({
          filter: newFilter,
          hasUnsavedChanges: get().activeFilterId !== null,
        });
      },

      addFilterExpression: (parentPath, expression) => {
        const { filter } = get();
        if (!filter) {
          if (parentPath.length === 0) {
            // Creating the initial filter
            set({
              filter: {
                type: "and",
                expressions: [expression],
              },
              hasUnsavedChanges: get().activeFilterId !== null,
            });
          }
          return;
        }

        // Deep clone the filter
        const newFilter = JSON.parse(JSON.stringify(filter));

        // Navigate to the parent node
        let current = newFilter;
        for (let i = 0; i < parentPath.length; i++) {
          if (current.type !== "and" && current.type !== "or") break;
          current = current.expressions[parentPath[i]];
        }

        // Add the new expression
        if (current.type === "and" || current.type === "or") {
          current.expressions.push(expression);
        }

        set({
          filter: newFilter,
          hasUnsavedChanges: get().activeFilterId !== null,
        });
      },

      removeFilterExpression: (path) => {
        const { filter } = get();
        if (!filter) return;

        // If removing the root, clear the filter
        if (path.length === 0) {
          set({
            filter: EMPTY_FILTER_GROUP_EXPRESSION,
            hasUnsavedChanges: get().activeFilterId !== null,
          });
          return;
        }

        // Deep clone the filter
        const newFilter = JSON.parse(JSON.stringify(filter));

        // Navigate to the parent node
        let current = newFilter as AndExpression | OrExpression;
        const parentPath = path.slice(0, -1);
        const childIndex = path[path.length - 1];

        for (let i = 0; i < parentPath.length; i++) {
          if (current.type !== "and" && current.type !== "or") break;
          current = current.expressions[parentPath[i]] as
            | AndExpression
            | OrExpression;
        }

        // Remove the expression
        if (current.type === "and" || current.type === "or") {
          current.expressions.splice(childIndex, 1);

          // If parent has no children, remove it too (unless it's the root)
          if (current.expressions.length === 0 && parentPath.length > 0) {
            get().removeFilterExpression(parentPath);
          }
        }

        set({
          filter: newFilter,
          hasUnsavedChanges: get().activeFilterId !== null,
        });
      },

      // New actions for managing the active filter ID
      setActiveFilterId: (id) => {
        set({
          activeFilterId: id,
          hasUnsavedChanges: false,
        });
      },

      setHasUnsavedChanges: (hasChanges) => {
        set({ hasUnsavedChanges: hasChanges });
      },

      clearActiveFilter: () => {
        set({
          activeFilterId: null,
          hasUnsavedChanges: false,
          filter: EMPTY_FILTER_GROUP_EXPRESSION,
          activeFilterName: "Untitled Filter",
        });
      },

      setActiveFilterName: (name) => {
        set({ activeFilterName: name, hasUnsavedChanges: true });
      },
    }),
    {
      name: "helicone-filter-storage",
      partialize: (state) => ({
        filter: state.filter,
        activeFilterId: state.activeFilterId,
        activeFilterName: state.activeFilterName,
        hasUnsavedChanges: state.hasUnsavedChanges,
      }),
    }
  )
);
