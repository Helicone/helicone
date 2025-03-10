import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FilterExpression, AndExpression, OrExpression } from "../filterAst";

export interface FilterState {
  // The active filter expression
  filter: FilterExpression | null;
  // Recently used filters for quick access
  recentFilters: FilterExpression[];
  // Saved filters with names
  savedFilters: { id: string; name: string; filter: FilterExpression }[];

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

  // Saved filter actions
  saveFilter: (name: string, filter: FilterExpression) => void;
  deleteSavedFilter: (id: string) => void;
  loadSavedFilter: (id: string) => void;
}

const DEFAULT_FILTER: AndExpression = {
  type: "and",
  expressions: [],
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filter: DEFAULT_FILTER,
      recentFilters: [],
      savedFilters: [],

      setFilter: (filter) => set({ filter }),

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
          set({ filter: expression });
          return;
        }

        set({ filter: newFilter });
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

        set({ filter: newFilter });
      },

      removeFilterExpression: (path) => {
        const { filter } = get();
        if (!filter) return;

        // If removing the root, clear the filter
        if (path.length === 0) {
          set({ filter: DEFAULT_FILTER });
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

        set({ filter: newFilter });
      },

      saveFilter: (name, filter) => {
        const { savedFilters } = get();
        const id = `filter-${Date.now()}`;

        set({
          savedFilters: [...savedFilters, { id, name, filter }],
        });
      },

      deleteSavedFilter: (id) => {
        const { savedFilters } = get();
        set({
          savedFilters: savedFilters.filter((f) => f.id !== id),
        });
      },

      loadSavedFilter: (id) => {
        const { savedFilters } = get();
        const savedFilter = savedFilters.find((f) => f.id === id);

        if (savedFilter) {
          set({ filter: savedFilter.filter });
        }
      },
    }),
    {
      name: "helicone-filter-storage",
    }
  )
);
