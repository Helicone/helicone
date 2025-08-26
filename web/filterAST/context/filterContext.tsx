import { useSearchParams } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFilterCrud } from "../hooks/useFilterCrud";
import { FilterState, useFilterStore, useTempFilterStore } from "../store/filterStore";
import { useContextHelpers } from "./useContextHelpers";

// Define the shape of our context
interface FilterContextType {
  store: FilterState;
  crud: ReturnType<typeof useFilterCrud>;
  helpers: ReturnType<typeof useContextHelpers>;
  setUseTempFilterStore: (useTemp: boolean) => void;
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
  const [useTemp, setUseTemp] = useState(false);
  const filterStore = useTemp ? useTempFilterStore() : useFilterStore();
  const searchParams = useSearchParams();

  console.log("useTemp", useTemp);

  const filterCrud = useFilterCrud();
  const helpers = useContextHelpers({
    filterStore,
    filterCrud,
  });

  // Initial URL hook
  useEffect(() => {
    const newInitialFilterId =
      searchParams?.get("filter_id") ?? filterStore.activeFilterId;
    if (!filterStore.alreadyLoadedOnce && newInitialFilterId) {
      helpers.loadFilterById(newInitialFilterId);
    }
  }, [searchParams, filterStore, filterCrud, helpers]);

  const setUseTempFilterStore = (useTemp: boolean) => {
    setUseTemp(useTemp);
  };
  
  const value = useMemo(
    () => ({
      store: filterStore,
      crud: filterCrud,
      helpers,
      setUseTempFilterStore,
    }),
    [filterStore, filterCrud, helpers, setUseTempFilterStore],
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
