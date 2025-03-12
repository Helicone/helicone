import { useSearchParams } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAutoSaveFilter } from "../hooks/useAutoSaveFilter";
import { useFilterActions } from "../hooks/useFilterActions";
import { StoreFilterType, useFilterCrud } from "../hooks/useFilterCrud";
import { useFilterNavigation } from "../hooks/useFilterNavigation";
import { FilterState, useFilterStore } from "../store/filterStore";
import { useContextHelpers } from "./useContextHelpers";

// Define the shape of our context
interface FilterContextType {
  store: FilterState;
  actions: ReturnType<typeof useFilterActions>;
  navigation: ReturnType<typeof useFilterNavigation>;
  crud: ReturnType<typeof useFilterCrud>;
  helpers: ReturnType<typeof useContextHelpers>;
}

// Create the context with a default value of null
const FilterContext = createContext<FilterContextType | null>(null);

// Props for the provider component
interface FilterProviderProps {
  children: ReactNode;
  options?: {
    autoSaveDelay?: number;
    defaultFilterName?: string;
  };
}

// The provider component
export const FilterProvider: React.FC<FilterProviderProps> = ({
  children,
  options,
}) => {
  const filterStore = useFilterStore();
  const searchParams = useSearchParams();

  const filterActions = useFilterActions();
  const filterNavigation = useFilterNavigation();
  const filterCrud = useFilterCrud();
  const helpers = useContextHelpers({
    filterStore,
    filterCrud,
  });
  // Use the auto-save hook
  useAutoSaveFilter({
    activeFilterId: filterStore.activeFilterId,
    hasUnsavedChanges: filterStore.hasUnsavedChanges,
    filter: filterStore.filter,
    savedFilters: filterCrud.savedFilters,
    updateFilter: async (filter) => {
      await filterCrud.updateFilter.mutateAsync(filter);
      filterStore.setHasUnsavedChanges(false);
    },
    autoSaveDelay: 1000,
  });
  // Initial URL hook
  useEffect(() => {
    if (filterStore.initialFilterId && !filterStore.activeFilterId) {
      const filterToLoad = filterCrud.savedFilters.find(
        (filter: StoreFilterType) => filter.id === filterStore.initialFilterId
      );

      if (filterToLoad) {
        helpers.loadFilterById(filterStore.initialFilterId);
      }
    }
    const newInitialFilterId = searchParams?.get("filter_id");
    if (newInitialFilterId) {
      filterStore.setInitialFilterId(newInitialFilterId);
    }
  }, [searchParams, filterStore, filterCrud]);

  const value = useMemo(
    () => ({
      store: filterStore,
      actions: filterActions,
      navigation: filterNavigation,
      crud: filterCrud,
      helpers,
    }),
    [filterStore, filterActions, filterNavigation, filterCrud, helpers]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

// Custom hook to use the filter context
export const useFilterAST = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};
